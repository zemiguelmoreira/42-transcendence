import json
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
import logging
logging.basicConfig(level=logging.INFO)
User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    online_users = set()

    async def connect(self):
        # Extract token from query string
        self.token = self.scope['query_string'].decode().split('=')[1]

        # Handle token
        try:
            access_token = AccessToken(self.token)
            self.user = await self.get_user_from_token(access_token)
            if not self.user:
                self.authenticated = False
                await self.close()
                return
        except (InvalidToken, TokenError):
            self.authenticated = False
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
        self.authenticated = True

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'update.status',
                'online_users': list(ChatConsumer.online_users)
            }
        )
        await self.channel_layer.group_send(
            self.user_group_name,
            {
                'type': 'system.message',
                'message': 'Welcome to the chat room! You are now connected.\nSelect a user if you wish to chat in private, or make sure none is selected to chat with everyone.'
            }
        )

    async def disconnect(self, close_code):
        if not self.authenticated:
            return
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.channel_layer.group_discard(self.user_group_name, self.channel_name)

        ChatConsumer.online_users.discard(self.user.username)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'update.status',
                'online_users': list(ChatConsumer.online_users)
            }
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get("message", None)
        recipient = text_data_json.get("recipient", None)
        msgtype = text_data_json.get("type", None)
        # If invite to game
        if msgtype == "invite":
            if not recipient or recipient == self.user.username:
                await self.channel_layer.group_send(
                    self.user_group_name, {"type": "error.message", "message": "Select a user to invite."}
                )
                return
            recipient_group_name = "user_%s" % recipient
            await self.channel_layer.group_send(
                recipient_group_name, {"type": "invite.message", "sender": self.user.username}
            )
            return
        elif msgtype == "invite_response":
            inviter = text_data_json.get("inviter", None)
            accepted = text_data_json.get("accepted", False)
            inviter_group_name = "user_%s" % inviter
            await self.channel_layer.group_send(
                inviter_group_name, {"type": "invite.response", "invitee": self.user.username, "accepted": accepted}
            )
            # if accepted:
            return

        # If public
        if not recipient:
            await self.channel_layer.group_send(
                self.room_group_name, {"type": "chat.message", "message": message, "sender": self.user.username}
            )
            return
        # If private
        recipient_group_name = "user_%s" % recipient
        # If sent to self
        if recipient == self.user.username:
            await self.channel_layer.group_send(
            recipient_group_name, {"type": "self.dm", "message": message}
            )
            return
        # To
        await self.channel_layer.group_send(
            recipient_group_name, {"type": "receive.dm", "message": message, "sender": self.user.username}
        )
        # From
        await self.channel_layer.group_send(
            self.user_group_name, {"type": "send.dm", "message": message, "dest": recipient}
        )


    async def chat_message(self, event):
        message = event["message"]
        sender = event["sender"]

        await self.send(text_data=json.dumps({"message": message, "sender": sender}))

    async def receive_dm(self, event):
        message = event["message"]
        sender = event["sender"]

        if sender == self.user.username:
            return
        await self.send(text_data=json.dumps({"message": message, "private": True, "sender": "From " + sender}))

    async def send_dm(self, event):
        message = event["message"]
        dest = event["dest"]

        await self.send(text_data=json.dumps({"message": message, "private": True, "sender": "To " + dest}))

    async def self_dm(self, event):
        message = event["message"]

        await self.send(text_data=json.dumps({"message": message, "selfdm": True, "sender": "Me"}))

    async def system_message(self, event):
        message = event["message"]

        await self.send(text_data=json.dumps({"message": message, "system": True, "sender": "Transcendence"}))

    async def error_message(self, event):
        message = event["message"]

        await self.send(text_data=json.dumps({"message": message, "error": True, "sender": "Error"}))

    async def invite_message(self, event):
        sender = event["sender"]

        await self.send(text_data=json.dumps({"invite": True, "sender": sender}))

    async def invite_response(self, event):
        invitee = event["invitee"]
        accepted = event["accepted"]
        await self.send(text_data=json.dumps({"invite_response": True, "invitee": invitee, "accepted": accepted}))


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
