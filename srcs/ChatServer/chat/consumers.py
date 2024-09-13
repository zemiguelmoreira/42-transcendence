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
from .matchmaking import matchmaking_manager
logging.basicConfig(level=logging.INFO)
User = get_user_model()

class MatchmakingConsumer(AsyncWebsocketConsumer):
	pong_queue = {}
	snake_queue = {}

	async def connect(self):
		self.token = await self.validate_token()
		if not self.token:
			await self.close()
			return

		self.user = await self.get_user_from_token(self.token)
		if not self.user:
			await self.close()
			logging.error("Matchmaking: Failed to get user from token.")
			return
		await self.initialize_connection()

	async def disconnect(self, close_code):
		if not self.authenticated:
			logging.info("Matchmaking: Not authenticated user disconnected.")
			return
		await self.cleanup_connection()
		return


	async def receive(self, text_data):
		data = json.loads(text_data)
		msgtype = data.get("type", None)

		message_type_map = {
			"join": self.join_matchmaking,
			"cancel": self.cancel_matchmaking,
		}
		if msgtype in message_type_map:
			await message_type_map[msgtype](data)

	async def join_matchmaking(self, data):
		self.game = await self.get_game_from_data(data)
		self.rank = await self.get_user_rank()
		# if not self.rank:
		# 	logging.error("Matchmaking: Failed to get user rank.")
		# 	return
		# add to queue & find match
		match = await matchmaking_manager.add_player(self.user.username, self.game, self.rank)
		await self.channel_layer.group_send(
			self.user_group_name, {"type": "system_message", "message": f"Waiting for a fair opponent in {self.game}."}
		)
		logging.info(f"Matchmaking: User {self.user.username} joined {self.game} matchmaking.")
		if match:
			await self.channel_layer.group_send(
				self.user_group_name, {"type": "system_message", "message": f"Match found! Starting a game of {self.game}."}
			)
			logging.info(f"Matchmaking: Match found for {self.user.username} in {self.game}.")
			logging.info(f"Matchmaking: Match is against {match[1]} in {self.game}.")
			# send match data
			await self.send(text_data=json.dumps({"match": True, "opponent": match[1], "game": self.game}))
			# send match data to opponent
			recipient_group_name = "user_%s" % match[1]
			await self.channel_layer.group_send(
				recipient_group_name, {"type": "system_message", "message": f"Match found! Starting a game of {self.game}."}
			)
			await self.channel_layer.group_send(
				recipient_group_name, {"type": "match_found", "opponent": self.user.username, "game": self.game}
			)
		else:
			await self.channel_layer.group_send(
				self.user_group_name, {"type": "system_message", "message": f"Couldn't find a fair game of {self.game}."}
			)
			logging.info(f"Matchmaking: User {self.user.username} didn't find a fair game of {self.game}.")

	async def cancel_matchmaking(self, data):
		matchmaking_manager.remove_player(self.user.username, self.game)
		await self.channel_layer.group_send(
			self.user_group_name, {"type": "system_message", "message": f"Left {self.game} matchmaking."}
		)
		logging.info(f"Matchmaking: User {self.user.username} left {self.game} matchmaking.")

	# event handlers
	async def match_found(self, event):
		opponent = event["opponent"]
		game = event["game"]
		await self.send(text_data=json.dumps({"match": True, "opponent": opponent, "game": game}))

	# utility methods
	async def get_game_from_data(self, data):
		game = data.get("game", None)
		if not game:
			logging.error("Matchmaking: No game provided.")
			return None
		elif game == "pong":
			return "pong"
		elif game == "snake":
			return "snake"
		else:
			logging.error("Matchmaking: Invalid game.")
			return None

	async def get_user_rank(self):
		url = f'http://userapi:8000/profile/{self.game}_rankings/'
		headers = {
			'Authorization': f'Bearer {self.token}',
		}
		try:
			async with httpx.AsyncClient() as client:
				response = await client.get(url, headers=headers)
				if response.status_code == 200:
					rank = response.json().get(f'{self.game}_rank', [])
					return rank
				else:
					logging.error(f"Failed to get rank: {response.status_code} {response.text}")
					return None
		except httpx.RequestError as e:
			logging.error(f"An error occurred while requesting user rank: {e}")
			return None


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
		# getting token from query string
		token = self.scope['query_string'].decode().split('=')[1]
		if not token:
			logging.error("Matchmaking: No token provided.")
			return None
		try:
			access_token = AccessToken(token)
			return access_token
		except (InvalidToken, TokenError):
			logging.error("Matchmaking: Invalid token.")
			return None


	async def initialize_connection(self):
		self.user_group_name = "user_%s" % self.user.username
		# accepting the websocket connection
		await self.accept()
		logging.info(f"Matchmaking: User {self.user.username} connected.")
		self.authenticated = True

	async def cleanup_connection(self):
		await matchmaking_manager.remove_player(self.user.username, self.game)
		# await self.channel_layer.group_send(
		# 	self.user_group_name, {"type": "system_message", "message": "Disconnected from matchmaking."}
		# )
		logging.info(f"Matchmaking: User {self.user.username} disconnected.")



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
			"cancel_invite": self.handle_cancel_invite,
		}
		if msgtype in message_type_map:
			await message_type_map[msgtype](data)
			return

		recipient = data.get("recipient", None)
		if not recipient:
			await self.handle_public_message(data)
		else:
			await self.handle_private_message(data, recipient)

	# Adicionando a função handle_cancel_invite
	async def handle_cancel_invite(self, data):
		recipient = data.get("recipient", None)

		# Verificando se o convite é válido
		if not recipient or not self.invited.get(recipient, False):
			await self.channel_layer.group_send(
				self.user_group_name, {"type": "error.message", "message": "No invite to cancel."}
			)
			logging.error("Cancel Invite: No invite to cancel.")
			return

		# Removendo o convite
		self.invited.pop(recipient, None)
		self.invited[self.user.username] = False

		# Notificando o destinatário que o convite foi cancelado
		recipient_group_name = "user_%s" % recipient
		await self.channel_layer.group_send(
			recipient_group_name, {
				"type": "cancel_invite.message",
				"sender": self.user.username,
			}
		)
		logging.info(f"Invite to {recipient} canceled by {self.user.username}.")

	# Adicionando handler para a mensagem de cancelamento do convite
	async def cancel_invite_message(self, event):
		sender = event["sender"]
		await self.send(text_data=json.dumps({
			"invite_cancelled": True,
			"sender": sender,
			"message": f"Invite from {sender} has been cancelled."
		}))

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
			logging.error("Invite: an invite pending.")
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

	# utility methods
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
