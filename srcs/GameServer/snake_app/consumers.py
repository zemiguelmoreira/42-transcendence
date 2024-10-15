import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'GameServer.settings')
django.setup()

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
import random


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

canvasHeight = 500
canvasWidth = 980
gridSize = 20

cols = canvasWidth // gridSize
rows = canvasHeight // gridSize



class SnakeConsumer(AsyncWebsocketConsumer):
	rooms = {}

	async def connect(self):
		query_params = parse_qs(self.scope['query_string'].decode())
		room_code = self.scope['url_route']['kwargs'].get('room_name', None)
		self.token = query_params.get('token', [None])[0]
		self.is_player = False

		user = await is_authenticated(self.token)
		if not user:
			await self.close()
			return

		self.user = user
		logger.info(f'TESTE User {user.username} connected')

		room = await get_room(room_code)
		if not room:
			logger.info(f'Room {room_code} not found')
			await self.close()
			return
		logger.info(f'Room {room.code} connected')

		self.room = room
		is_auth = await check_user_access(self.room, self.user)
		logger.info(f'is auth: {is_auth}')
		if not is_auth:
			logger.info(f'User {user.username} do not have access to {self.room.code}')
			await self.close()
			return

		await self.accept()
		logger.info(f'User {user.username} connected to room {self.room.code}')

		if self.room.code not in SnakeConsumer.rooms:
			SnakeConsumer.rooms[self.room.code] = {
				'players': [],
				'snakes':
						[
							{ 'username': "", 'color': '#0000FF', 'segments': [{ 'x': 5, 'y': 10 }, { 'x': 4, 'y': 10 }], 'direction': 'RIGHT', 'newDirection': 'RIGHT', 'alive': True },
							{ 'username': "", 'color': '#00FF00', 'segments': [{ 'x': 10, 'y': 5 }, { 'x': 10, 'y': 6 }], 'direction': 'RIGHT', 'newDirection': 'RIGHT', 'alive': True }
						],
				'score': [0, 0],
				'food': {'x': 0, 'y': 0},
				'snake_speed': 500,
			}

		room = SnakeConsumer.rooms[self.room.code]

		for player in room['players']:
			if player.user.id == self.user.id:
				await self.close()
				return

		if len(room['players']) < 2 and self not in room['players']:
			self.is_player = True
			room['players'].append(self)
			player_index = room['players'].index(self)
			room['snakes'][player_index]['username'] = self.user.username

			await self.send(json.dumps({
				'action': 'assign_index',
				'player_index': player_index,
				'score': room['score']
			}))

		if len(room['players']) == 2:
			for player in room['players']:
				await player.send(json.dumps({
					'action': 'start_game',
					'player_names': [room['players'][0].user.username, room['players'][1].user.username],
				}))

			if 'game_loop_task' not in room or room['game_loop_task'] is None:
				room['game_loop_task'] = asyncio.create_task(self.game_loop(room))
			else:
				logger.info('Game loop já em execução')

		else:
			await self.send(json.dumps({'action': 'wait_for_player'}))

	async def disconnect(self, close_code):
		logger.info(f'Disconnected: {self.user.username}')
		if self.room.code in SnakeConsumer.rooms:
			room = SnakeConsumer.rooms[self.room.code]

			player_index = None
			for i, player in enumerate(room['players']):
				if player.user.id == self.user.id:
					player_index = i
					break

			if player_index is not None:
				room['snakes'][player_index]['alive'] = False
				logger.info(f"Player {self.user.username}'s snake is now dead due to disconnection.")

		await self.close()

	async def receive(self, text_data):
		data = json.loads(text_data)

		if self.is_player and 'action' in data:
			if data['action'] == 'move':
				player_index = data['player_index']
				new_direction = data['direction']
				
				# Verificar se a nova direção é válida
				current_direction = SnakeConsumer.rooms[self.room.code]['snakes'][player_index]['direction']
				if self.is_valid_direction(current_direction, new_direction):
					SnakeConsumer.rooms[self.room.code]['snakes'][player_index]['newDirection'] = new_direction

	async def game_loop(self, room):
		while room['players']:
			await self.update_game_state(room)
			await asyncio.sleep(0.08)

		if not room['players']:
			if 'game_loop_task' in room:
				room['game_loop_task'].cancel()  # Cancela o loop do jogo
			del SnakeConsumer.rooms[self.room.code]  # Remove a sala
		

	async def update_game_state(self, room):
		alive_snakes = [snake for snake in room['snakes'] if snake['alive']]

		if len(alive_snakes) <= 1:
			if len(alive_snakes) == 1:
				for player in room['players']:
					await player.end_game(room, alive_snakes[0]['username'])
			return

		for i, snake in enumerate(room['snakes']):
			self.move_snake(snake, room)
			self.check_collisions(snake, room, i)

		response = {
			'snakes': room['snakes'],
			'score': room['score'],
			'food': room['food'],
		}
		
		for player in room['players']:
			asyncio.create_task(player.send(json.dumps(response)))

		if len(room['players']) == 0:
			room['game_loop_task'].cancel()
			room['game_loop_task'] = None
			del SnakeConsumer.rooms[self.room.code]


	def move_snake(self, snake, room):
		snake['direction'] = snake['newDirection']
		head = {**snake['segments'][0]}

		if snake['direction'] == 'RIGHT':
			head['x'] += 1
		elif snake['direction'] == 'LEFT':
			head['x'] -= 1
		elif snake['direction'] == 'UP':
			head['y'] -= 1
		elif snake['direction'] == 'DOWN':
			head['y'] += 1

		head['x'] %= cols
		head['y'] %= rows

		if head['x'] == room['food']['x'] and head['y'] == room['food']['y']:
			snake['segments'].insert(0, head)
			room['food'] = self.generate_food_position()
			room['score'][room['snakes'].index(snake)] += 1
		else:
			snake['segments'].insert(0, head)
			snake['segments'].pop()

	def check_collisions(self, snake, room, snake_index):
		head = snake['segments'][0]

		if any(segment == head for segment in snake['segments'][1:]):
			logger.info('colisao com proprio corpo')
			snake['alive'] = False

		for i, other_snake in enumerate(room['snakes']):
			if i != snake_index and other_snake['alive']:
				if head == other_snake['segments'][0]:
					logger.info('colisao com outra head cobra')
					score_self = room['score'][snake_index]
					score_other = room['score'][i]

					if score_self > score_other:
						other_snake['alive'] = False 
					elif score_self < score_other:
						snake['alive'] = False
					else:
						logger.info('colisao com outra head cobra pontuacao iguais')
						if random.choice([True, False]):
							snake['alive'] = False
						else:
							other_snake['alive'] = False

				elif any(segment == head for segment in other_snake['segments'][1:]):
					logger.info('colisao com outra body cobra')
					snake['alive'] = False



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
			'timestamp': formatted_time,
			'game_type': 'snake',
			'ranked': True
		}

		result = {
			'action': 'game_over',
			'winner': winner,
			'loser': loser,
			'winner_score': winner_score,
			'loser_score': loser_score,
			'timestamp': formatted_time,
			'game_type': 'snake',
		}
		
		# Salvar partida no banco de dados
		if winner == self.user.username:
			for player in room['players']:
				await player.save_match_history(to_save)
				await player.send(json.dumps(result))
			room['players'].clear()  # Limpa a lista de jogadores


	async def save_match_history(self, match_data):
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