import os
import django
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import json
import time
from datetime import datetime, timezone
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken
from urllib.parse import parse_qs
from GameServer.utils import is_authenticated, get_room, check_user_access
import logging
import httpx
from .snakegame import snake_game
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'GameServer.settings')
django.setup()

class SnakeConsumer(AsyncWebsocketConsumer):

	async def connect(self):
		self.authenticated = False
		self.token = await self.validate_token()
		if not self.token:
			await self.close()
			return
		self.user = await self.get_user_from_token(self.token)
		if not self.user:
			await self.close()
			logging.error("Snake: connect: Failed to get user from token.")
			return
		await self.initialize_connection()
		await self.add_to_room()


	async def disconnect(self, close_code):
		try:
			room = SnakeConsumer.rooms[self.room.code]

			# Sinalizar o fim do jogo
			room['end_game'] = True
			room['disconnect'] = self.user.username
			logger.info(f"Room {self.room.code}: Game ended by disconnection from {self.user.username}")

		except KeyError:
			logger.error(f"Room {self.room.code} not found in SnakeConsumer.rooms")
			return
		# room = SnakeConsumer.rooms.get(self.room.code, None)

		# if room:
		# 	# Se o jogador desconectar, removê-lo da lista de jogadores ativos
		# 	if hasattr(self, 'is_player') and self.is_player and self in room['players']:
		# 		room['players'].remove(self)

		# 	# Não cancelar o loop do jogo mesmo que um jogador saia
		# 	if not room['players']:
		# 		# Se não houver jogadores, podemos deixar o jogo ativo e aguardando reconexão.
		# 		room['game_loop_task'] = None

		# await self.close()

	async def receive(self, text_data):
		data = json.loads(text_data)
		if self.is_player and 'action' in data:
			if data['action'] == 'move':
				new_direction = data['direction']
				current_direction = self.room['snakes'][self.player_index]['direction']
				if self.is_valid_direction(current_direction, new_direction):
					async with snake_game.locks[self.room_code]:
							self.room['snakes'][self.player_index]['newDirection'] = new_direction

	async def game_loop(self, room):
		# logger.info('game loop in back')
		# last_time = time.time()

		while room['players']:
			# current_time = time.time()
			# delta_time = current_time - last_time
			# last_time = current_time

			await self.update_game_state(room )
			await asyncio.sleep(0.08)  # Increase update frequency for smoother ball movement


	async def update_game_state(self, room):
		alive_snakes = [snake for snake in room['snakes'] if snake['alive']]

		if len(alive_snakes) <= 1:
			if len(alive_snakes) == 1:
				for player in room['players']:
					await player.end_game(room, alive_snakes[0]['username'])
			return

		for i, snake in enumerate(room['snakes']):
			# if snake['alive']:
			self.move_snake(snake, room)
			self.check_collisions(snake, room, i)

		response = {
			'snakes': room['snakes'],
			'score': room['score'],
			'food': room['food'],
		}

		for player in room['players']:
			asyncio.create_task(player.send(json.dumps(response)))

			# Verificar se o jogo terminou por desconexão

		if room.get('end_game'):
			logger.info('Game identified as ending due to disconnection')
			loser = room['disconnect']

			# Definir o vencedor com base no jogador que não desconectou
			if room['players'][0].user.username == loser:
				winner = room['players'][1].user.username
			else:
				winner = room['players'][0].user.username

			logger.info(f"Game result due to disconnection: Winner: {winner}, Loser: {loser}")

			# Notificar ambos os jogadores e encerrar o jogo
			for player in room['players']:
				await player.end_game(room, winner)

			logger.info(f"Game result by score: Winner: {winner}, Loser: {loser}")

			# Notificar ambos os jogadores e encerrar o jogo
			for player in room['players']:
				await player.end_game(room, winner)

			# # Remover o jogador da sala e encerrar a partida
			# room['players'].remove(self)
			# logger.info('Player removed from room')

		# Se não houver mais jogadores, cancelar o loop do jogo
		if len(room['players']) == 0 or room['save_count'] == 2:
			room['game_loop_task'].cancel()
			room['game_loop_task'] = None
			del SnakeConsumer.rooms[self.room.code]


	def move_snake(self, snake, room):
		# logger.info(f'inside move func: {snake}')
		# Atualiza a direção da cobra
		snake['direction'] = snake['newDirection']
		head = {**snake['segments'][0]}

		# Mover a cabeça da cobra de acordo com a direção
		if snake['direction'] == 'RIGHT':
			head['x'] += 1
		elif snake['direction'] == 'LEFT':
			head['x'] -= 1
		elif snake['direction'] == 'UP':
			head['y'] -= 1
		elif snake['direction'] == 'DOWN':
			head['y'] += 1

		# logger.info(snake['direction'])
		# Envolver as bordas (wrap around)
		head['x'] %= cols
		head['y'] %= rows

		# Verificar se a cobra comeu a comida
		if head['x'] == room['food']['x'] and head['y'] == room['food']['y']:
			snake['segments'].insert(0, head)  # Cresce a cobra
			room['food'] = self.generate_food_position()  # Gera nova posição de comida
			room['score'][room['snakes'].index(snake)] += 1
		else:
			snake['segments'].insert(0, head)
			snake['segments'].pop()  # Remove o último segmento para mover a cobra

	def check_collisions(self, snake, room, snake_index):
		head = snake['segments'][0]

		# Check self-collision (colisão com o próprio corpo)
		if any(segment == head for segment in snake['segments'][1:]):
			logger.info('colisao com proprio corpo')
			snake['alive'] = False

		# Check collision with other snakes (colisão com outras cobras)
		for i, other_snake in enumerate(room['snakes']):
			if i != snake_index and other_snake['alive']:
				# Colisão de cabeça com cabeça
				if head == other_snake['segments'][0]:
					logger.info('colisao com outra head cobra')
					score_self = room['score'][snake_index]
					score_other = room['score'][i]

					# Comparar pontuações
					if score_self > score_other:
						other_snake['alive'] = False  # Cobra com menos pontos perde
					elif score_self < score_other:
						snake['alive'] = False  # Cobra com menos pontos perde
					else:
						# Se as pontuações forem iguais, escolhe aleatoriamente a vencedora
						logger.info('colisao com outra head cobra pontuacao iguais')
						if random.choice([True, False]):
							snake['alive'] = False
						else:
							other_snake['alive'] = False

				# Verificar colisão com o corpo da outra cobra
				elif any(segment == head for segment in other_snake['segments'][1:]):
					logger.info('colisao com outra body cobra')
					snake['alive'] = False

		# Verificar se sobrou apenas uma cobra viva
		alive_snakes = [s for s in room['snakes'] if s['alive']]
		if len(alive_snakes) == 1 and not room['end_game']:
			logger.info('sobrou apenas uma')
			for player in room['players']:
				player.end_game(room, alive_snakes[0]['username'])


	def generate_food_position(self):
		return {'x': random.randint(0, cols - 1), 'y': random.randint(0, rows - 1)}

	def random_color(self):
		return f'rgb({random.randint(0, 255)}, {random.randint(0, 255)}, {random.randint(0, 255)})'

	def is_valid_direction(self, current_direction, new_direction):
		opposite_directions = {
			'UP': 'DOWN',
			'DOWN': 'UP',
			'LEFT': 'RIGHT',
			'RIGHT': 'LEFT'
		}
		return opposite_directions[current_direction] != new_direction



	async def end_game(self, room, winner=None):
		logger.info('function end_game called')
		loser = room['players'][1].user.username if room['players'][1].user.username != winner else room['players'][0].user.username

		winner_score = room['score'][0] if room['players'][0].user.username == winner else room['score'][1]
		loser_score = room['score'][1] if room['players'][0].user.username == winner else room['score'][0]

		logger.info(f'winner: {winner}')
		logger.info(f'loser: {loser}')

		timestamp = int(time.time())
		formatted_time = datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()

		to_save = {
			'winner': winner,
			'loser': loser,
			'winner_score': winner_score,
			'loser_score': loser_score,
			'timestamp': self.room['formatted_time'],
			'game_type': 'snake',
			'ranked': True,
		}
		await self.save_match_history(to_save)


	async def game_over(self, event):
		self.is_player = False
		logger.info('Consumer: Game Over Called\n')
		result  = {
			'action': 'game_over',
			'winner': event['winner'],
			'loser': event['loser'],
			'winner_score': event['winner_score'],
			'loser_score': event['loser_score'],
			'timestamp': event['timestamp'],
			'game_type': 'snake',
		}
		to_save = {
			'winner': event['winner'],
			'loser': event['loser'],
			'winner_score': event['winner_score'],
			'loser_score': event['loser_score'],
			'timestamp': event['timestamp'],
			'game_type': 'snake',
			'ranked': True,
		}
		await self.save_match_history(to_save)
		await self.send(json.dumps(result))
		# await self.close()

	# others
	async def save_match_history(self, match_data):
		logger.info('Consumer: Save Match History Called\n')
		url = 'http://userapi:8000/profile/update_match_history/'
		headers = {
			'Content-Type': 'application/json',
			'Authorization': f'Bearer {self.token}',
		}
		try:
			async with httpx.AsyncClient() as client:
				response = await client.post(url, json=match_data, headers=headers)
				response.raise_for_status()
				logger.info(f"Match history saved successfully: {response.json()}")
		except httpx.HTTPStatusError as http_err:
			logger.error(f"HTTP error occurred: {http_err}")
		except Exception as err:
			logger.error(f"Other error occurred: {err}")

	def is_valid_direction(self, current_direction, new_direction):
		opposite_directions = {
			'UP': 'DOWN',
			'DOWN': 'UP',
			'LEFT': 'RIGHT',
			'RIGHT': 'LEFT'
		}
		return opposite_directions[current_direction] != new_direction
