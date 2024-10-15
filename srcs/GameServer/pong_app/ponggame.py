import asyncio
# import aioredis
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
channel_layer = get_channel_layer()
# redis_client = aioredis.from_url("redis://redis:6379", decode_responses=True)

class PongGame:
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

	tasks = {}
	rooms = {}
	# adiciona ao room
	def addToRoom(self, room_code, username):
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
				'disconnect': "",
				'wall_collision': False
			}
			player_index = 0
		else:
			player_index = 1
		if PongGame.rooms[room_code]['players'] > 1:
			logging.error(f"PongGame: addToRoom: Invalid number of players in room: {room_code}")
			return
		PongGame.rooms[room_code]['players'].append(username)
		user_game_group_name = f"user_game_{username}"
		await channel_layer.group_send(
			user_game_group_name, {
				"type": "assign.index",

			})


	# cria thread p game e gravas tasks por room
	def start_game(self, room_code):
		if room_code not in tasks:
			PongGame.tasks[room_code] = asyncio.create_task(self.start_game(room_code))
			logging.info(f"PongGame: addToRoom: task created for room {room_code}")



	def game_loop:



	def is_goal_paddle1(ball_x):
		return ball_x + BALL_SIZE >= canvasWidth

	def is_goal_paddle2(ball_x):
		return ball_x <= 0

	def is_collision_paddle1(ball_x, ball_y, paddle_y):
		return (ball_x <= PADDLE_WIDTH and ball_y + BALL_SIZE >= paddle_y and ball_y <= paddle_y + PADDLE_HEIGHT)


	def is_collision_paddle2(ball_x, ball_y, paddle_y):
		return (ball_x + BALL_SIZE >= canvasWidth - PADDLE_WIDTH and ball_y + BALL_SIZE >= paddle_y and ball_y <= paddle_y + PADDLE_HEIGHT)

pong_game = PongGame()
