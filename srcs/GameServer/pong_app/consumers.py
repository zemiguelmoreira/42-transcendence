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
from .ponggame import pong_game
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'GameServer.settings')
django.setup()

class PongConsumer(AsyncWebsocketConsumer):

	async def connect(self):
		self.authenticated = False
		self.token = await self.validate_token()
		if not self.token:
			await self.close()
			return
		self.user = await self.get_user_from_token(self.token)
		if not self.user:
			await self.close()
			logging.error("Pong: connect: Failed to get user from token.")
			return
		await self.initialize_connection()
		await self.add_to_room()


	async def disconnect(self, close_code):
		if not self.authenticated:
			logging.info("Pong: disconnect: Not authenticated user disconnected.")
			return
		await self.cleanup_connection()
		return


	async def receive(self, text_data):
		data = json.loads(text_data)
		if self.is_player and 'action' in data:
			if data['action'] == 'move':
				async with pong_game.locks[self.room_code]:
					self.room['current_directions'][self.player_index] = data['direction']


	async def add_to_room(self):
		data = await pong_game.addToRoom(self.room_code, self.user.username)
		if data is None:
			await self.close()
			return
		self.room = pong_game.rooms[self.room_code]
		self.player_index = data['player_index']
		self.is_player = True
		await self.send(json.dumps(data))
		if len(self.room['players']) < 2:
			logger.info(f'Consumer: Wait for Player Called user {self.user.username}\n')
			await self.send(json.dumps({
				'action': 'wait_for_player',
				'player_index': self.player_index,
				'ball_position': self.room['ball_position'],
				'paddle_positions': self.room['paddle_positions'],
				'score': self.room['score']
			}))
		while len(self.room['players']) < 2:
			await asyncio.sleep(1/10)
		await self.send(json.dumps({
			'action': 'start_game',
			'player_index': self.player_index,
			'player_names': [self.room['players'][0], self.room['players'][1]],
			'ball_position': self.room['ball_position'],
			'paddle_positions': self.room['paddle_positions'],
			'score': self.room['score']
		}))
		if self.player_index == 1:
			await pong_game.start_game(self.room_code)


	async def game_update(self, event):
		game_state = event['game_state']
		await self.send(json.dumps(game_state))


	# connection methods
	@database_sync_to_async
	def get_user_from_token(self, access_token):
		try:
			user_id = access_token['user_id']
			user = User.objects.get(id=user_id)
			return user
		except (User.DoesNotExist):
			return None


	async def validate_token(self):
		query_params = parse_qs(self.scope['query_string'].decode())
		self.room_code = self.scope['url_route']['kwargs'].get('room_code', None)
		token = query_params.get('token', [None])[0]
		if not token:
			logging.error("Pong: validate_token: No token provided.")
			return None
		try:
			access_token = AccessToken(token)
			return access_token
		except (InvalidToken, TokenError):
			logging.error("Pong: validate_token: Invalid token.")
			return None


	async def initialize_connection(self):
		self.authenticated = True
		self.is_player = False
		room = await get_room(self.room_code)
		if not room or not check_user_access(room, self.user):
			await self.close()
			return
		# accepting the websocket connection
		logging.info(f"Pong: initialize_connection: User {self.user.username} connected.")
		await self.accept()
		self.room_group_name = f'room_{self.room_code}'
		await self.channel_layer.group_add(self.room_group_name, self.channel_name)



	async def cleanup_connection(self):
		await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
		if self.is_player:
			await self.handle_game_disconnect()
			await pong_game.user_disconnect(self.room_code, self.user.username)



	async def handle_game_disconnect(self):
		self.room['disconnect'] = self.user.username
		self.room['end_game'] = True
		winner = self.room['players'][0] if self.room['players'][0] != self.user.username else self.room['players'][1]
		loser = self.user.username
		winner_score = self.room['score'][0] if self.room['players'][0] == winner else self.room['score'][1]
		loser_score = self.room['score'][0] if self.room['players'][0] == loser else self.room['score'][1]
		to_save = {
			'winner': winner,
			'loser': loser,
			'winner_score': winner_score,
			'loser_score': loser_score,
			'timestamp': self.room['formatted_time'],
			'game_type': 'pong',
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
