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
		await self.channel_layer.group_add(self.room_group_name, self.channel_name)
		# add to room
		pong_game.addToRoom(self.room.code, self.user.username)

	# event handlers
	async def assign_index(self, event):
		await self.send(json.dumps({
			'action':
		}))



