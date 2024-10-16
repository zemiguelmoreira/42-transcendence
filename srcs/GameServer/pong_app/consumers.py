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
from .ponggame import pong_game

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PongConsumer(AsyncWebsocketConsumer):


	async def connect(self):
		query_params = parse_qs(self.scope['query_string'].decode())
		room_code = self.scope['url_route']['kwargs'].get('room_code', None)
		self.token = query_params.get('token', [None])[0]
		self.is_player = False
		user = await is_authenticated(self.token)
		if not user:
			await self.close()
			return
		self.user = user
		room = await get_room(room_code)
		if not room:
			await self.close()
			return
		self.room = room
		is_auth = await check_user_access(self.room, self.user)
		logger.info(f'is auth: {is_auth}')
		if not is_auth:
			logger.info(f'User {user.username} do not have access to {self.room.code}')
			await self.close()
			return
		await self.accept()
		# channels room
		self.room_group_name = f'room_{self.room.code}'
		self.user_game_group_name = f'user_game_{self.user.username}'
		await self.channel_layer.group_add(self.room_group_name, self.channel_name)
		await self.channel_layer.group_add(self.user_game_group_name, self.channel_name)
		# add to room
		logger.info('Consumer: Callign add to room\n')
		await pong_game.addToRoom(self.room.code, self.user.username)


	async def disconnect(self, close_code):
		logger.info('Consumer: Disconnected Called\n')
		await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
		await self.channel_layer.group_discard(self.user_game_groupS_name, self.channel_name)
		if self.is_player:
			await pong_game.user_disconnect(self.room.code, self.user.username)


	async def receive(self, text_data):
		# logger.info('Consumer: Receive Called\n')
		data = json.loads(text_data)
		if self.is_player and 'action' in data:
			if data['action'] == 'move':
				player_index = data['player_index']
				direction = data['direction']
				await pong_game.move_paddle(self.room.code, player_index, direction)


	# event handlers
	async def assign_index(self, event):
		logger.info(f'Consumer: Assign Index Called {self.user.username}\n')
		self.is_player = True
		self.player_index = event['player_index']
		await self.send(json.dumps({
			'action': 'assign_index',
			'player_index': self.player_index,
			'ball_position': event['ball_position'],
			'paddle_positions': event['paddle_positions'],
			'score': event['score']
		}))
		await pong_game.check_start_game(self.room.code, self.player_index, self.user.username)


	async def start_game(self, event):
		logger.info(f'Consumer: Start Game Called {self.user.username}\n')
		await self.send(json.dumps({
			'action': 'start_game',
			'player_index': self.player_index,
			'player_names': event['player_names'],
			'ball_position': event['ball_position'],
			'paddle_positions': event['paddle_positions'],
			'score': event['score']
		}))
		if self.player_index == 1:
			await pong_game.start_game(self.room.code)



	async def wait_forplayer(self, event):
		logger.info(f'Consumer: Wait For Player Called {self.user.username}\n')
		await self.send(json.dumps({
			'action': 'wait_for_player',
			'player_index': self.player_index,
			'ball_position': event['ball_position'],
			'paddle_positions': event['paddle_positions'],
			'score': event['score']
		}))


	async def update_gamestate(self, event):
		# logger.info('Consumer: Update Game State Called\n')
		await self.send(json.dumps({
			'ball_position': event['ball_position'],
			'paddle_positions': event['paddle_positions'],
			'score': event['score']
		}))


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
			'game_type': 'pong',
		}
		to_save = {
			'winner': event['winner'],
			'loser': event['loser'],
			'winner_score': event['winner_score'],
			'loser_score': event['loser_score'],
			'timestamp': event['timestamp'],
			'game_type': 'pong',
			'ranked': True,
		}
		await self.save_match_history(to_save)
		await self.send(json.dumps(result))
		await self.close()


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
				response.raise_for_status()  # Levanta exceções para códigos de status de erro
				logger.info(f"Match history saved successfully: {response.json()}")
		except httpx.HTTPStatusError as http_err:
			logger.error(f"HTTP error occurred: {http_err}")
		except Exception as err:
			logger.error(f"Other error occurred: {err}")
