import asyncio
# import aioredis
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging
import time
from datetime import datetime, timezone

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
# redis_client = aioredis.from_url("redis://redis:6379", decode_responses=True)

canvasHeight = 560
canvasWidth = 960
PADDLE_WIDTH = 20
PADDLE_HEIGHT = 90
BALL_SIZE = 10
FINAL_SCORE = 10

paddles_init_y = 310 - 62
paddle1_init_x = 0
paddle2_init_x = canvasWidth - PADDLE_WIDTH

ball_init_x = canvasWidth / 2 - BALL_SIZE / 2
ball_init_y = canvasHeight / 2 - BALL_SIZE / 2

def is_goal_paddle1(ball_x):
	return ball_x + BALL_SIZE >= canvasWidth

def is_goal_paddle2(ball_x):
	return ball_x <= 0

def is_collision_paddle1(ball_x, ball_y, paddle_y):
	return (ball_x <= PADDLE_WIDTH and ball_y + BALL_SIZE >= paddle_y and ball_y <= paddle_y + PADDLE_HEIGHT)


def is_collision_paddle2(ball_x, ball_y, paddle_y):
	return (ball_x + BALL_SIZE >= canvasWidth - PADDLE_WIDTH and ball_y + BALL_SIZE >= paddle_y and ball_y <= paddle_y + PADDLE_HEIGHT)

class PongGame:
	channel_layer = get_channel_layer()
	tasks = {}
	rooms = {}
	locks ={}

	# adiciona ao room
	async def addToRoom(self, room_code, username):
		logger.info(f"PongGame: addToRoom: Adding {username} to room {room_code}")
		PongGame.locks[room_code] = asyncio.Lock()
		async with PongGame.locks[room_code]:
			if room_code not in PongGame.rooms:
				PongGame.rooms[room_code] = {
					'players': [],
					'ball_position': [ball_init_x, ball_init_y],
					'paddle_positions': [[paddle1_init_x, paddles_init_y], [paddle2_init_x, paddles_init_y]],
					'ball_velocity': [500, 500],
					'current_directions': ['idle', 'idle'],
					'score': [0, 0],
					'paddle_speed': 800,
					'end_game': False,
					'disconnect': None,
					'wall_collision': False,
				}
			room = PongGame.rooms[room_code]
			room['players'].append(username)
			player_index = room['players'].index(username)
		return {
			'type': 'assign.index',
			'player_index': player_index,
			'ball_position': room['ball_position'],
			'paddle_positions': room['paddle_positions'],
			'score': room['score'],
		}


	# cria thread p game e gravas tasks por room
	async def start_game(self, room_code):
		# logger.info(f"PongGame: start_game: Starting game for room {room_code}")
		if room_code not in PongGame.tasks:
			room = PongGame.rooms[room_code]
			PongGame.tasks[room_code] = asyncio.create_task(self.game_loop(room_code, room))
			logging.info(f"PongGame: start_game: task created for room {room_code}")
		else:
			logging.error(f"PongGame: start_game: Task already exists for room {room_code}")


	async def game_loop(self, room_code, room):
		logger.info(f"PongGame: game_loop: Starting game loop for room {room_code}")
		last_time = time.time()
		while not room['end_game']:
			current_time = time.time()
			delta_time = current_time - last_time
			last_time = current_time
			room['formatted_time'] = datetime.fromtimestamp(int(current_time), tz=timezone.utc).isoformat()
			await self.update_game_state(room_code, room, delta_time)
			async with PongGame.locks[room_code]:
				game_state = {
					'ball_position': room['ball_position'],
					'paddle_positions': room['paddle_positions'],
					'score': room['score'],
				}
			await PongGame.channel_layer.group_send(
				f"room_{room_code}", {
					'type': 'game.update',
					'game_state': game_state,
				})
			await asyncio.sleep(1/20)
		await self.game_over(room_code, room)


	async def user_disconnect(self, room_code, username):
		logging.info(f"PongGame: user_disconnect: {username} disconnected from room {room_code}")
		if room_code not in PongGame.rooms:
			logging.error(f"PongGame: user_disconnect: Invalid room code {room_code}")
			return
		room = PongGame.rooms[room_code]
		if username not in room['players']:
			logging.error(f"PongGame: user_disconnect: Invalid player {username} in room {room_code}")
			return
		room['disconnect'] = username
		room['end_game'] = True


	async def update_game_state(self, room_code, room, delta_time):
		# logger.info(f"PongGame: update_game_state: Updating game state")
		room['ball_position'][0] += room['ball_velocity'][0] * delta_time
		room['ball_position'][1] += room['ball_velocity'][1] * delta_time
		# wall collision
		if not room['wall_collision'] and (room['ball_position'][1] <= 0  or room['ball_position'][1] + BALL_SIZE >= canvasHeight):
			room['ball_velocity'][1] *= -1
			room['wall_collision'] == True
		# reset collision flag
		if room['ball_position'][1] > BALL_SIZE + 1 and room['ball_position'][1] < canvasHeight - BALL_SIZE - 1:
			room['wall_collision'] == False
		if is_goal_paddle1(room['ball_position'][0]):
			room['score'][0] += 1
			room['ball_position'] = [ball_init_x, ball_init_y]
			room['ball_velocity'][0] *= -1
			# logger.info("Gol do paddle 1")
		if is_goal_paddle2(room['ball_position'][0]):
			room['score'][1] += 1
			room['ball_position'] = [ball_init_x, ball_init_y]
			room['ball_velocity'][0] *= -1
			# logger.info("Gol do paddle 2")
		# paddle colision
		if room['ball_velocity'][0] < 0 and is_collision_paddle1(room['ball_position'][0], room['ball_position'][1], room['paddle_positions'][0][1]):
			room['ball_velocity'][0] *= -1
			# logger.info("Colidiu paddle 1")
		if room['ball_velocity'][0] > 0 and is_collision_paddle2(room['ball_position'][0], room['ball_position'][1], room['paddle_positions'][1][1]):
			room['ball_velocity'][0] *= -1
			# logger.info("colidiu paddle 2")
		for i in range(len(room['paddle_positions'])):
			direction = room['current_directions'][i]
			if direction == 'up':
				room['paddle_positions'][i][1] = max(room['paddle_positions'][i][1] - room['paddle_speed'] * delta_time, 0)
			elif direction == 'down':
				room['paddle_positions'][i][1] = min(room['paddle_positions'][i][1] + room['paddle_speed'] * delta_time, canvasHeight - PADDLE_HEIGHT)
		if room['score'][0] == FINAL_SCORE or room['score'][1] == FINAL_SCORE:
			room['end_game'] = True


	async def game_over(self, room_code, room):
		logger.info(f"PongGame: game_over: Game over")
		logger.info(f"Game finished by reaching final score: {room['score'][0]} - {room['score'][1]}")
		if not room['disconnect']:
			if room['score'][0] == FINAL_SCORE:
				winner = room['players'][0]
				loser = room['players'][1]
			else:
				loser = room['players'][0]
				winner = room['players'][1]
		else:
			winner = room['players'][0] if room['players'][0] != room['disconnect'] else room['players'][1]
			loser = room['disconnect']
		logger.info(f"Game result by score: Winner: {winner}, Loser: {loser}")
		winner_score = room['score'][0] if room['players'][0] == winner else room['score'][1]
		loser_score = room['score'][0] if room['players'][0] == loser else room['score'][1]
		await PongGame.channel_layer.group_send(
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
		logging.info(f"PongGame: end_game: Ending game for room {room_code}")
		if room_code in PongGame.tasks:
			if not PongGame.tasks[room_code].done():
				PongGame.tasks[room_code].cancel()
			del PongGame.tasks[room_code]
			logging.info(f"PongGame: end_game: task canceled for room {room_code}")
		if room_code in PongGame.rooms:
			del PongGame.rooms[room_code]
			logging.info(f"PongGame: end_game: room {room_code} deleted")


pong_game = PongGame()
