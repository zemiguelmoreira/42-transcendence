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
import httpx
logging.basicConfig(level=logging.INFO)
User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
	online_users = {}
	invited = {}

	async def connect(self):
		self.token = await self.validate_token()
		if not self.token:
			await self.close()
			return

		self.user = await self.get_user_from_token(self.token)
		if not self.user:
			await self.close()
			logging.error("Failed to get user from token.")
			return
		await self.initialize_connection()


	async def disconnect(self, close_code):
		if not self.authenticated:
			logging.info("Not authenticated user disconnected.")
			return
		await self.cleanup_connection()
		return


	async def receive(self, text_data):
		data = json.loads(text_data)
		msgtype = data.get("type", None)

		message_type_map = {
        "invite": self.handle_invite,
        "invite_response": self.handle_invite_response,
    }
		if msgtype in message_type_map:
			await message_type_map[msgtype](data)
			return

		recipient = data.get("recipient", None)
		if not recipient:
			await self.handle_public_message(data)
		else:
			await self.handle_private_message(data, recipient)


	# receive handlers
	async def handle_invite(self, data):
		recipient = data.get("recipient", None)
		game = data.get("game", None)
		roomCode = data.get("roomCode", None)

		# invite error handling
		if not recipient or recipient == self.user.username:
			await self.channel_layer.group_send(
				self.user_group_name, {"type": "error.message", "message": "Invite a valid user."}
			)
			logging.error("Invite: Invalid recipient.")
			return
		if self.invited.get(recipient, False):
			await self.channel_layer.group_send(
				self.user_group_name, {"type": "error.message", "message": "User already has an invite pending."}
			)
			logging.error("Invite: Recipient already has an invite pending.")
			return
		if self.invited.get(self.user.username, False):
			await self.channel_layer.group_send(
				self.user_group_name, {"type": "error.message", "message": "You already have an invite pending."}
			)
			logging.error("Invite: User already has an invite pending.")
			return
		# setting invite flags
		self.invited[recipient] = True
		self.invited[self.user.username] = True
		# sending invite
		recipient_group_name = "user_%s" % recipient
		await self.channel_layer.group_send(
			recipient_group_name, {
				"type": "invite.message",
				"sender": self.user.username,
				"game": game,
				"roomCode": roomCode,
			}
		)
		logging.info(f"Invite sent to {recipient}.")

	async def handle_invite_response(self, data):
		game = data.get("game", None)
		inviter = data.get("inviter", None)
		accepted = data.get("accepted", False)
		# answering invite
		inviter_group_name = "user_%s" % inviter
		await self.channel_layer.group_send(
			inviter_group_name, {
				"type": "invite.response",
				"invitee": self.user.username,
				"accepted": accepted,
				"game": game
			}
		)
		logging.info(f"Invite response sent to {inviter}.")
		# setting invite flags
		self.invited[self.user.username] = False
		self.invited[inviter] = False

	async def handle_private_message(self, data, recipient):
		message = data.get("message", None)
		recipient_group_name = "user_%s" % recipient
		# to self
		if recipient == self.user.username:
			await self.channel_layer.group_send(
				recipient_group_name, {"type": "self.dm", "message": message}
			)
			logging.info(f"Private message sent to self by {self.user.username}.")
			return
		# to others
		await self.channel_layer.group_send(
			recipient_group_name, {"type": "receive.dm", "message": message, "sender": self.user.username}
		)
		await self.channel_layer.group_send(
			self.user_group_name, {"type": "send.dm", "message": message, "dest": recipient}
		)
		logging.info(f"Private message sent to {recipient} by {self.user.username}.")


	async def handle_public_message(self, data):
		message = data.get("message", None)
		await self.channel_layer.group_send(
		self.room_group_name, {"type": "chat.message", "message": message, "sender": self.user.username}
			)
		logging.info(f"Public message sent by {self.user.username}.")


	# event handlers
	async def chat_message(self, event):
		message = event["message"]
		sender = event["sender"]
		# check if sender is blocked
		blocked_users = await self.get_blocked_user_list()
		if blocked_users is None:
			blocked_users = []
			logging.error("Failed to get blocked users list.")
		if sender in blocked_users:
			return
		if sender == self.user.username:
			await self.send(text_data=json.dumps({"message": message, "self": True, "sender": "To all"}))
		else:
			await self.send(text_data=json.dumps({"message": message, "sender": sender}))

	async def receive_dm(self, event):
		message = event["message"]
		sender = event["sender"]
		# check if sender is blocked
		blocked_users = await self.get_blocked_user_list()
		if blocked_users is None:
			blocked_users = []
			logging.error("Failed to get blocked users list.")
		if sender == self.user.username or sender in blocked_users:
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
		game = event.get("game", None)
		roomCode = event.get("roomCode", None)

		await self.send(text_data=json.dumps({
			"invite": True,
			"sender": sender,
			"game": game,
			"roomCode": roomCode
		}))

	async def invite_response(self, event):
		invitee = event["invitee"]
		accepted = event["accepted"]
		game = event.get("game", "a game")

		await self.send(text_data=json.dumps({
			"invite_response": True,
			"invitee": invitee,
			"accepted": accepted,
			"game": game
		}))

	async def update_status(self, event):
		online_users = event['online_users']

		await self.send(text_data=json.dumps({
			'online_users': online_users
		}))
		logging.info("Status updated.")

	# methods
	async def validate_token(self):
		# getting token from query string
		token = self.scope['query_string'].decode().split('=')[1]
		if not token:
			logging.error("No token provided.")
			return None
		try:
			access_token = AccessToken(token)
			return access_token
		except (InvalidToken, TokenError):
			logging.error("Invalid token.")
			return None

	async def initialize_connection(self):
		# all chat group and single user chat group
		self.room_group_name = "all"
		self.user_group_name = "user_%s" % self.user.username
		# accepting the websocket connection
		await self.accept()
		logging.info(f"User {self.user.username} connected.")
		self.authenticated = True
		# adding user to channel groups and online list
		await self.channel_layer.group_add(self.room_group_name, self.channel_name)
		await self.channel_layer.group_add(self.user_group_name, self.channel_name)
		await self.add_online_user()
		# send welcome system msg
		await self.channel_layer.group_send(
			self.user_group_name,
			{
				'type': 'system.message',
				'message': 'Welcome to the chat room! You are now connected.\nSelect a user if you wish to chat in private, or make sure none is selected to chat with everyone.'
			}
		)

	async def cleanup_connection(self):
		await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
		await self.channel_layer.group_discard(self.user_group_name, self.channel_name)
		await self.remove_online_user()
		logging.info(f"User {self.user.username} disconnected.")

	@database_sync_to_async
	def get_user_from_token(self, access_token):
		try:
			user_id = access_token['user_id']
			user = User.objects.get(id=user_id)
			return user
		except (User.DoesNotExist):
			return None

	async def add_online_user(self):
		self.online_users[self.user.username] = self.online_users.get(self.user.username, 0) + 1
		await self.update_user_status()

	async def remove_online_user(self):
		if self.online_users.get(self.user.username, 0) > 1:
			self.online_users[self.user.username] -= 1
		else:
			self.online_users.pop(self.user.username, None)
		await self.update_user_status()

	async def update_user_status(self):
		online_users_sorted = sorted(list(self.online_users))
		await self.channel_layer.group_send(
			self.room_group_name,
			{
				'type': 'update.status',
				'online_users': online_users_sorted
			}
		)

	async def get_blocked_user_list(self):
		url = 'http://userapi:8000/profile/blocked_list/'
		headers = {
			'Authorization': f'Bearer {self.token}',
		}

		async with httpx.AsyncClient() as client:
			response = await client.get(url, headers=headers)
			if response.status_code == 200:
				blocked_users = response.json().get('blocked_list', [])
				return blocked_users
			else:
				return None
