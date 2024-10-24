import asyncio
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging
import time
from datetime import datetime, timezone
import random

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class SnakeGame:
	canvasHeight = 500
	canvasWidth = 980
	gridSize = 20
	cols = canvasWidth // gridSize
	rows = canvasHeight // gridSize
	channel_layer = get_channel_layer()
	tasks = {}
	rooms = {}
	locks ={}

	async def addToRoom(self, room_code, username):
		logger.info(f"SnakeGame: addToRoom: Adding {username} to room {room_code}")
		SnakeGame.locks[room_code] = asyncio.Lock()
		async with SnakeGame.locks[room_code]:
			if room_code not in SnakeGame.rooms:
				SnakeGame.rooms[room_code] = {
					'players': [],
					'snakes':
							[
								{ 'username': "", 'color': '#0000FF', 'segments': [{ 'x': 5, 'y': 10 }, { 'x': 4, 'y': 10 }], 'direction': 'RIGHT', 'newDirection': 'RIGHT', 'alive': True },
								{ 'username': "", 'color': '#00FF00', 'segments': [{ 'x': 10, 'y': 5 }, { 'x': 10, 'y': 6 }], 'direction': 'RIGHT', 'newDirection': 'RIGHT', 'alive': True }
							],
					'score': [0, 0],
					'food': {'x': 0, 'y': 0},
					'snake_speed': 500,
					'end_game': False,
					'disconnect': "",
					'save_count': 0
				}
			room = SnakeGame.rooms[room_code]
			room['players'].append(username)
			player_index = room['players'].index(username)
			room['snakes'][player_index]['username'] = username
		return {
				'action': 'assign_index',
				'player_index': player_index,
				'score': room['score']
			}

	async def start_game(self, room_code):
		if room_code not in SnakeGame.tasks:
			room = SnakeGame.rooms[room_code]
			SnakeGame.tasks[room_code] = asyncio.create_task(self.game_loop(room_code, room))
			logging.info(f"SnakeGame: start_game: task created for room {room_code}")
		else:
			logging.error(f"SnakeGame: start_game: Task already exists for room {room_code}")


	async def game_loop(self, room_code, room):
		try:
			logger.info(f"SnakeGame: game_loop: Starting game loop for room {room_code}")
			while not room['end_game']:
				room['formatted_time'] = datetime.fromtimestamp(int(time.time()), tz=timezone.utc).isoformat()
				await self.update_game_state(room_code, room)
				async with SnakeGame.locks[room_code]:
					game_state = {
						'snakes': room['snakes'],
						'score': room['score'],
						'food': room['food'],
					}
				await SnakeGame.channel_layer.group_send(
					f"room_{room_code}", {
						'type': 'game.update',
						'game_state': game_state,
					})
				await asyncio.sleep(1/12)
			await self.game_over(room_code, room)
		except asyncio.CancelledError:
			logging.info(f"GameServer: SnakeGame for room {room_code} was cancelled.")
		except Exception as e:
			logging.error(f"GameServer: Error in SnakeGame task for room {room_code}: {e}")


	async def user_disconnect(self, room_code, username):
		logging.info(f"SnakeGame: user_disconnect: {username} disconnected from room {room_code}")
		if room_code not in SnakeGame.rooms:
			logging.error(f"SnakeGame: user_disconnect: Invalid room code {room_code}")
			return
		room = SnakeGame.rooms[room_code]
		if username not in room['players']:
			logging.error(f"SnakeGame: user_disconnect: Invalid player {username} in room {room_code}")
			return
		room['disconnect'] = username
		room['end_game'] = True


	async def update_game_state(self, room_code, room):
		alive_snakes = [snake for snake in room['snakes'] if snake['alive']]
		if len(alive_snakes) <= 1:
			if len(alive_snakes) == 1:
				room['alive_snake'] = alive_snakes[0]['username']
				room['end_game'] = True
			return
		for i, snake in enumerate(room['snakes']):
			self.move_snake(snake, room)
			self.check_collisions(snake, room, i)


	async def game_over(self, room_code, room):
		logger.info(f"SnakeGame: game_over: Game over")
		if not room['disconnect']:
			winner = room['alive_snake']
			loser = room['players'][1] if room['players'][1] != winner else room['players'][0]
		else:
			loser = room['disconnect']
			winner = room['players'][1] if room['players'][1] != loser else room['players'][0]
		winner_score = room['score'][0] if room['players'][0] == winner else room['score'][1]
		loser_score = room['score'][1] if room['players'][0] == winner else room['score'][0]
		await SnakeGame.channel_layer.group_send(
			f"room_{room_code}", {
				'type': 'game.over',
				'winner': winner,
				'loser': loser,
				'winner_score': winner_score,
				'loser_score': loser_score,
				'timestamp': room['formatted_time'],
			})
		await self.end_game(room_code, room)


	async def end_game(self, room_code, room):
		logging.info(f"SnakeGame: end_game: Ending game for room {room_code}")
		if room_code in SnakeGame.tasks:
			if not SnakeGame.tasks[room_code].done():
				SnakeGame.tasks[room_code].cancel()
			del SnakeGame.tasks[room_code]
			logging.info(f"SnakeGame: end_game: task canceled for room {room_code}")
		if room_code in SnakeGame.rooms:
			del SnakeGame.rooms[room_code]
			logging.info(f"SnakeGame: end_game: room {room_code} deleted")


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

		head['x'] %= SnakeGame.cols
		head['y'] %= SnakeGame.rows

		if head['x'] == room['food']['x'] and head['y'] == room['food']['y']:
			snake['segments'].insert(0, head)
			room['food'] = self.generate_food_position()
			room['score'][room['snakes'].index(snake)] += 1
		else:
			snake['segments'].insert(0, head)
			snake['segments'].pop()

	def check_collisions(self, snake, room, snake_index):
		head = snake['segments'][0]
		# Check self-collision
		if any(segment == head for segment in snake['segments'][1:]):
			snake['alive'] = False
		# Check collision with other snakes
		for i, other_snake in enumerate(room['snakes']):
			if i != snake_index and other_snake['alive']:
				# Collision head to head
				if head == other_snake['segments'][0]:
					score_self = room['score'][snake_index]
					score_other = room['score'][i]

					if score_self > score_other:
						other_snake['alive'] = False
					elif score_self < score_other:
						snake['alive'] = False
					else:
						if random.choice([True, False]):
							snake['alive'] = False
						else:
							other_snake['alive'] = False

				elif any(segment == head for segment in other_snake['segments'][1:]):
					snake['alive'] = False

		alive_snakes = [s for s in room['snakes'] if s['alive']]
		if len(alive_snakes) == 1:
			room['alive_snake'] = alive_snakes[0]['username']
			room['end_game'] = True


	def generate_food_position(self):
		return {'x': random.randint(0, SnakeGame.cols - 1), 'y': random.randint(0, SnakeGame.rows - 1)}

	def random_color(self):
		return f'rgb({random.randint(0, 255)}, {random.randint(0, 255)}, {random.randint(0, 255)})'


snake_game = SnakeGame()
