import json
import logging
import os
import django
from django.conf import settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ChatServer.settings')
django.setup()
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    online_users = set()

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
        self.room_name = 'all'
        self.room_group_name = "chat_%s" % self.room_name
        self.user_group_name = "user_%s" % self.user.username

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.channel_layer.group_add(self.user_group_name, self.channel_name)

        ChatConsumer.online_users.add(self.user.username)

        await self.accept()

        logging.info(f'User {self.user.username} connected to chat')
        # Broadcast the updated list of online users
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'update.status',
                'online_users': list(ChatConsumer.online_users)
            }
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.channel_layer.group_discard(self.user_group_name, self.channel_name)
        logging.info(f'User {self.user.username} disconnected from chat')

        ChatConsumer.online_users.discard(self.user.username)
        # Broadcast the updated list of online users
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'update.status',
                'online_users': list(ChatConsumer.online_users)
            }
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        recipient = text_data_json.get("recipient", None)
        logging.info(f"Message: {message}, Recipient: {recipient}, Sender: {self.user.username}")
        if recipient:
            if recipient == self.user.username:
                return
            recipient_group_name = "user_%s" % recipient
            await self.channel_layer.group_send(
                recipient_group_name, {"type": "private.message", "message": message, "sender": self.user.username}
            )
        else:
            await self.channel_layer.group_send(
                self.room_group_name, {"type": "chat.message", "message": message, "sender": self.user.username}
            )

    async def chat_message(self, event):
        message = event["message"]
        sender = event["sender"]

        await self.send(text_data=json.dumps({"message": message, "sender": sender}))
        logging.info(f"Message received: {message} from {sender}")
    async def private_message(self, event):
        message = event["message"]
        sender = event["sender"]

        await self.send(text_data=json.dumps({"message": message, "private": True, "sender": sender}))
        logging.info(f"Private message received: {message} from {sender}")

    @database_sync_to_async
    def get_user_from_token(self, access_token):
        try:
           user_id = access_token['user_id']
           user = User.objects.get(id=user_id)
           return user
        except (User.DoesNotExist):
            return None

    async def update_status(self, event):
        online_users = event['online_users']

        await self.send(text_data=json.dumps({
            'online_users': online_users
        }))
        logging.info(f"Online users updated: {online_users}")
