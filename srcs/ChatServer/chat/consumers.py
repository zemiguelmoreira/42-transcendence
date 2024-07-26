import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'GameServer.settings')
django.setup()

from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import json
import time
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken
from urllib.parse import parse_qs
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

User = get_user_model()
# o other user se vier na query tenho q abrir uma socket so para os online# tenho q ir buscar o other user doura forma se quiser fazer tudo so com uma socket
class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        logger.info('connect')
        query_params = parse_qs(self.scope['query_string'].decode())
        self.token = query_params.get('token', [None])[0]
        self.other_user = query_params.get('other_user', [None])[0]

        try:
            access_token = AccessToken(self.token)
            logger.info(f'access_token: {access_token}')
            user_id = access_token['user_id']
            self.user = await self.get_user(user_id)
            logger.info(f'user: {self.user.username}')
            if not self.user:
                await self.close()
                return
        except (InvalidToken, TokenError):
            await self.close()
            return

        myUser = self.user.username
        otherUser = self.other_user

        self.room_name = self.generate_room_name(self.username, self.other_username)
        logger.info(f'room_name: {self.room_name}')
        self.room_group_name = f'chat_{self.room_name}'
        logger.info(f'room_group_name: {self.room_group_name}')
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.set_user_online(self.user)
        await self.accept()


    async def disconnect(self, close_code):
        logger.info('disconnect')
        await self.set_user_offline(self.user)
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )


    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        print(data)
        message = data['message']
        username = data['username']
        receiver = data['receiver']

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': username,
            }
        )


    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        username = event['username']

        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message,
            'username': username,
        }))

    @database_sync_to_async
    def set_user_online(self, user):
        UserStatus.objects.update_or_create(user=user, defaults={'is_online': True})

    @database_sync_to_async
    def set_user_offline(self, user):
        UserStatus.objects.filter(user=user).update(is_online=False)

    @database_sync_to_async
    def get_user(self, user_id):
        # Synchronous ORM call wrapped for async context
        return User.objects.get(id=user_id)

    def generate_room_name(self, user1, user2):
        # Generate room name based on sorted usernames
        return f'{min(user1, user2)}-{max(user1, user2)}'
