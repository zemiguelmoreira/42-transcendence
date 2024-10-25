import json
import os
import django
from django.conf import settings
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken
import logging
import httpx

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ChatServer.settings')
django.setup()
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
	MAX_MESSAGE_LENGTH = 200
	online_users = {}


	async def connect(self):
		self.authenticated = False
		self.token = await self.validate_token()
		if not self.token:
			await self.close()
			return
		self.user = await self.get_user_from_token(self.token)
		if not self.user:
			await self.close()
			logging.error("Chat: connect: Failed to get user from token.")
			return
		await self.initialize_connection()


	async def disconnect(self, close_code):
		if not self.authenticated:
			logging.info("Chat: disconnect: Not authenticated user disconnected.")
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
			"sys_message": self.handle_sys_message,
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
	# tourney warning
	async def handle_sys_message(self, data):
		message = data.get("message", None)
		await self.channel_layer.group_send(
			self.user_group_name, {"type": "system.message", "message": message}
		)


	#cancel inviter invite
	async def handle_cancel_invite(self, data):
		if self.inviting is None:
			return
		self.inviting = None
		recipient = data.get("recipient", None)
		if not recipient:
			await self.channel_layer.group_send(
				self.user_group_name, {"type": "error.message", "message": "No invite to cancel."}
			)
			logging.error("Chat: handle_cancel_invite: Cancel Invite: No invite to cancel.")
			return
		recipient_group_name = "user_%s" % recipient
		await self.channel_layer.group_send(
			recipient_group_name, {
				"type": "cancel_invite.message",
				"sender": self.user.username,
			}
		)
		logging.info(f"Chat: handle_cancel_invite: Invite to {recipient} cancelled by {self.user.username}.")


	#send inviter invite
	async def handle_invite(self, data):
		recipient = data.get("recipient", None)
		game = data.get("game", None)
		# invite error handling
		if not recipient or recipient == self.user.username:
			await self.channel_layer.group_send(
				self.user_group_name, {"type": "error.message", "message": "Invite a valid user."}
			)
			logging.error("Chat: handle_invite: Invite: Invalid recipient.")
			return
		if self.inviting:
			await self.channel_layer.group_send(
				self.user_group_name, {"type": "error.message", "message": f"Something went wrong with the last invite sent."}
			)
			logging.error("Chat: handle_invite: Invite: Last invite error.")
			return
		else:
			# sending invite
			recipient_group_name = "user_%s" % recipient
			await self.channel_layer.group_send(
				recipient_group_name, {
					"type": "invite.message",
					"sender": self.user.username,
					"game": game,
				}
			)
			self.inviting = recipient
			logging.info(f"Chat: handle_invite: Invite sent to {recipient} by {self.user.username}.")


	# invitee response to invite
	#  creates room if accepted and sends roomcode to inviter and frontend
	async def handle_invite_response(self, data):
		game = data.get("game", None)
		inviter = data.get("inviter", None)
		accepted = data.get("accepted", False)
		roomCode = None
		if inviter not in self.pending:
			logging.error("Chat: handle_invite_response: Invite was cancelled")
			await self.channel_layer.group_send(
				self.user_group_name, {"type": "error.message", "message": f"Invite from {inviter} was cancelled."}
			)
			return
		if accepted:
			roomCode = await self.create_room(self.token, inviter)
			await self.send(text_data=json.dumps({
				"room": True,
				"game": game,
				"roomCode": roomCode
			}))
  		# answering invite
		inviter_group_name = "user_%s" % inviter
		await self.channel_layer.group_send(
			inviter_group_name, {
				"type": "invite.response",
				"invitee": self.user.username,
				"accepted": accepted,
				"game": game,
				"roomCode": roomCode
			}
		)
		self.pending.remove(inviter)
		logging.info(f"Chat: handle_invite_response: Invite response sent to {inviter}.")


	async def handle_private_message(self, data, recipient):
		message = data.get("message", None)
		if not message or len(message) > ChatConsumer.MAX_MESSAGE_LENGTH:
			logging.info("Chat: handle_private_message: Message not send because it is too big.")
			return
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
		if not message or len(message) > ChatConsumer.MAX_MESSAGE_LENGTH:
			logging.info("Chat: handle_public_message: Message not send because it is too big.")
			return
		await self.channel_layer.group_send(
		self.room_group_name, {"type": "chat.message", "message": message, "sender": self.user.username}
			)
		logging.info(f"Chat: handle_public_message: Public message sent by {self.user.username}.")


	# event handlers
	async def chat_message(self, event):
		message = event["message"]
		sender = event["sender"]
		# check if sender is blocked
		blocked_users = await self.get_blocked_user_list()
		if blocked_users is None:
			blocked_users = []
			logging.error("Chat: chat_message: Failed to get blocked users list.")
		if sender in blocked_users:
			return
		if sender == self.user.username:
			await self.send(text_data=json.dumps({"message": message, "self": True, "sender": "To all", "sent": True, "public": True}))
		else:
			await self.send(text_data=json.dumps({"message": message, "sender": sender, "received": True, "public": True}))


	async def receive_dm(self, event):
		message = event["message"]
		sender = event["sender"]
		# check if sender is blocked
		blocked_users = await self.get_blocked_user_list()
		if blocked_users is None:
			blocked_users = []
			logging.error("Chat: receive_dm: Failed to get blocked users list.")
		if sender == self.user.username or sender in blocked_users:
			return
		await self.send(text_data=json.dumps({"message": message, "private": True, "sender": "From " + sender, "received": True}))


	async def send_dm(self, event):
		message = event["message"]
		dest = event["dest"]
		await self.send(text_data=json.dumps({"message": message, "private": True, "sender": "To " + dest, "sent": True}))


	async def self_dm(self, event):
		message = event["message"]
		await self.send(text_data=json.dumps({"message": message, "selfdm": True, "sender": "Me"}))


	async def system_message(self, event):
		message = event["message"]
		await self.send(text_data=json.dumps({"message": message, "system": True, "sender": "Transcendence"}))


	async def error_message(self, event):
		message = event["message"]
		await self.send(text_data=json.dumps({"message": message, "error": True, "sender": "Error"}))


	# invitee letting frontend know of received invite
	async def invite_message(self, event):
		sender = event["sender"]
		game = event.get("game", None)
		await self.send(text_data=json.dumps({
			"invite": True,
			"sender": sender,
			"game": game,
		}))
		self.pending.append(sender)


	# inviter letting frontend know of invite response
	async def invite_response(self, event):
		if self.inviting is None:
			logging.error("Chat: invite_response: This invite was cancelled previously, not doing anything")
			return
		invitee = event["invitee"]
		accepted = event["accepted"]
		game = event.get("game", "a game")
		roomCode = event.get("roomCode", None)
		# if accepted: (handled from url change on frontend)
		# 	self.channel_layer.group_send(
		# 		"user_mm_%s" % self.user.username, {
		# 			"type": "chat.cancel"
		# 		}
		# 	)
		# 	self.channel_layer.group_send(
		# 		"user_mm_%s" % invitee, {
		# 			"type": "chat.cancel"
		# 		}
		# 	)
		self.inviting = None
		await self.send(text_data=json.dumps({
			"invite_response": True,
			"invitee": invitee,
			"accepted": accepted,
			"game": game,
			"roomCode": roomCode
		}))


	# cancel invite for invitee
	async def cancel_invite_message(self, event):
		sender = event["sender"]
		await self.send(text_data=json.dumps({
			"invite_cancelled": True,
			"sender": sender,
			# "message": f"Invite from {sender} has been cancelled."
		}))
		self.pending.remove(sender)


	async def update_status(self, event):
		await self.send(text_data=json.dumps({
			'online_users': event['online_users']
		}))
		logging.info("Chat: update_status: Status updated.")


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
			logging.error("Chat: valdiate_token: No token provided.")
			return None
		try:
			access_token = AccessToken(token)
			return access_token
		except (InvalidToken, TokenError):
			logging.error("Chat: validate_token: Invalid token.")
			return None


	async def initialize_connection(self):
		# all chat group and single user chat group
		self.room_group_name = "all"
		self.user_group_name = "user_%s" % self.user.username
		# accepting the websocket connection
		await self.accept()
		logging.info(f"Chat: initialize_connection: User {self.user.username} connected.")
		self.authenticated = True
		self.inviting = None# inviting status
		self.pending = [] # pending invites
		# adding user to channel groups and online list
		await self.channel_layer.group_add(self.room_group_name, self.channel_name)
		await self.channel_layer.group_add(self.user_group_name, self.channel_name)
		await self.add_online_user()


	async def cleanup_connection(self):
		await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
		await self.channel_layer.group_discard(self.user_group_name, self.channel_name)
		await self.remove_online_user()
		await self.invites_cleanup()
		logging.info(f"Chat: cleanup_connection: User {self.user.username} disconnected.")

	async def invites_cleanup(self):
		if self.inviting:
			invitee_group_name = "user_%s" % self.inviting
			await self.channel_layer.group_send(
				invitee_group_name, {"type": "cancel_invite.message", "sender": self.user.username}
			)
		if self.pending:
			for user in self.pending:
				inviter_group_name = "user_%s" % user
				await self.channel_layer.group_send(
					inviter_group_name, {"type": "invite.response",
						"invitee": self.user.username,
						"accepted": False,
						# "game": "a game",
						# "roomCode": None
					}
				)

	# utility methods
	async def add_online_user(self):
		ChatConsumer.online_users[self.user.username] = ChatConsumer.online_users.get(self.user.username, 0) + 1
		if ChatConsumer.online_users[self.user.username] == 1:
			await self.update_user_status(True)
		else:
			# update online status for self only (new tab)
			await self.channel_layer.group_send(
				self.user_group_name,
				{
					'type': 'update.status',
					'online_users': sorted(list(ChatConsumer.online_users))
				}
			)


	async def remove_online_user(self):
		if ChatConsumer.online_users.get(self.user.username, 0) > 1:
			ChatConsumer.online_users[self.user.username] -= 1
		else:
			ChatConsumer.online_users.pop(self.user.username, None)
			await self.update_user_status(False)


	async def update_user_status(self, is_logged_in):
		await self.channel_layer.group_send(
			self.room_group_name,
			{
				'type': 'update.status',
				'online_users': sorted(list(ChatConsumer.online_users))
			}
		)
		await self.post_user_status(is_logged_in)


	async def post_user_status(self, is_logged_in):
		url = f"https://nginx:{os.getenv('NGINX_PORT')}/api/profile/update_onlinestatus/"
		headers = {
			'Authorization': f'Bearer {self.token}',
		}
		data = {
			'is_logged_in': is_logged_in
		}
		async with httpx.AsyncClient(verify=False) as client:
			try:
				response = await client.post(url, headers=headers, json=data)
				if response.status_code == 200:
					logging.info('Online status updated successfully.')
				else:
					logging.error(f'Failed to update online status: {response.json()}')
			except httpx.RequestError as exc:
				logging.error(f'Failed to update online status: {exc}')


	async def get_blocked_user_list(self):
		url = f"https://nginx:{os.getenv('NGINX_PORT')}/api/profile/blocked_list/"
		headers = {
			'Authorization': f'Bearer {self.token}',
		}

		async with httpx.AsyncClient(verify=False) as client:
			response = await client.get(url, headers=headers)
			if response.status_code == 200:
				blocked_users = response.json().get('blocked_list', [])
				return blocked_users
			else:
				return None


	async def create_room(self, game_accessToken, authorized_user):
		data = None

		logger.info(f"Create_room: Creating room for {authorized_user}")
		logger.info(f"Create_room: Game Access Token: {game_accessToken}")

		try:
			async with httpx.AsyncClient(verify=False) as client:
				response = await client.post(
					f"https://nginx:{os.getenv('NGINX_PORT')}/game/create-room/",
					headers={
						'Content-Type': 'application/json',
						'Authorization': f'Bearer {game_accessToken}',
					},
					json={
						'authorized_user': authorized_user,
						'ranked': False,
					},
				)
				data = response.json()
				logger.info(f"CreateRoom: {data}")

				if response.status_code != 200:
					logger.error(f"Create_room: Error: {data}")

		except Exception as e:
			logger.info(f'Create_room: Error creating room: {e}')

		return data.get('code') if data else None
