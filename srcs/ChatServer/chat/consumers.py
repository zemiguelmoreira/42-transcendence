import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.conf import settings
from rest_framework_simplejwt.exceptions import InvalidTokenError
from rest_framework_simplejwt.tokens import AccessToken

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Extract token from query string
        self.token = self.scope['query_string'].decode().split('=')[1]
        logging.info(f'token: {self.token}')

        # Handle token
        try:
            access_token = AccessToken(self.token)
            self.user = await self.get_user_from_token(access_token)
            logging.info(f'user: {self.user}')
            if not self.user:
                logging.info('User not found')
                await self.close()
                return
        except (InvalidToken, TokenError):
            logging.info('Invalid token')
            await self.close()
            return

        # Set room and user group names
        self.room_name = 'transcendence'
        self.room_group_name = "chat_%s" % self.room_name
        self.user_group_name = "user_%s" % self.user.username

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.channel_layer.group_add(self.user_group_name, self.channel_name)

        await self.accept()
        logging.info(f'User {self.user.username} connected to chat')

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.channel_layer.group_discard(self.user_group_name, self.channel_name)
        logging.info(f'User {self.user.username} disconnected from chat')

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        recipient = text_data_json.get("recipient")

        if recipient:
            recipient_group_name = "user_%s" % recipient
            await self.channel_layer.group_send(
                recipient_group_name, {"type": "private_message", "message": message, "sender": self.user.username}
            )
        else:
            await self.channel_layer.group_send(
                self.room_group_name, {"type": "chat_message", "message": message, "sender": self.user.username}
            )

    async def chat_message(self, event):
        message = event["message"]

        await self.send(text_data=json.dumps({"message": message, "sender": event["sender"]}))

    async def private_message(self, event):
        message = event["message"]

        await self.send(text_data=json.dumps({"message": message, "private": True, "sender": event["sender"]}))

    @database_sync_to_async
    def get_user_from_token(self, access_token):
        try:
           user_id = access_token['user_id']
           user = User.objects.get(id=user_id)
           return user
        except (User.DoesNotExist):
            return None
