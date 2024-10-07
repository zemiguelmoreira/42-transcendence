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

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
User = get_user_model()

class MatchmakingConsumer(AsyncWebsocketConsumer):
	def __init__(self):
		self.game = None # coz of cleanup connection


	async def connect(self):
		self.authenticated = False
		self.token = await self.validate_token()
		if not self.token:
			await self.close()
			return
		self.user = await self.get_user_from_token(self.token)
		if not self.user:
			await self.close()
			logging.error("Matchmaking: connect: Failed to get user from token.")
			return
		await self.initialize_connection()


	async def disconnect(self, close_code):
		if not self.authenticated:
			logging.info("Matchmaking: disconnect: Not authenticated user disconnected.")
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
		if self.game is None:
			logging.error("Matchmaking: join_matchmaking: Invalid game.")
			return
		self.rank = await self.get_user_rank()
		if self.rank is None:
			logging.error("Matchmaking: join_matchmaking: Failed to get user rank.")
			return
		await self.matchmake()


	async def matchmake(self):
		logging.info(f"Matchmaking: matchmake: User {self.user.username} joined {self.game} matchmaking.")
		await matchmaking_manager.add_player(self.user.username, self.game, self.rank)


	async def cancel_matchmaking(self, data):
		game = data.get("game", None)
		logging.info(f"Matchmaking: cancel_matchmaking: User {self.user.username} left {game} matchmaking.")
		await matchmaking_manager.cancel_matchmaking(self.user.username, game)


	# event handlers
	async def match_notFound(self, event):
		logging.info(f"Matchmaking: match_notFound: Match not found for {self.user.username} in {self.game}. Rejoining matchmaking.")
		await self.matchmake()


	# match found from matchmaking manager
	async def match_found(self, event):
		game = event["game"]
		opponent = event["opponent"]
		roomCode = await create_room(self.token, opponent)
		logging.info(f"Matchmaking: match_found: Match found for {self.user.username} in {game} against {opponent} in room {roomCode}. Sending match data.")
		opponent_mm_group_name = "user_mm_%s" % opponent
		# send match data to opponent
		await self.channel_layer.group_send(
			opponent_mm_group_name, {
				"type": "match.details",
				"game": game,
				"roomCode": roomCode,
				"opponent": self.user.username
			}
		)
		# chat warning for self
		await self.channel_layer.group_send(
			self.user_group_name, {
				"type": "system.message",
				"message": f"Match found! Starting a game of {self.game} against {opponent}"
			}
		)
		# send match data to client
		await self.send(text_data=json.dumps({
			"match": "match_created",
			"opponent": opponent,
			"game": game,
			"roomCode": roomCode,
		}))


	# match info from host
	async def match_details(self, event):
		game = event["game"]
		roomCode = event["roomCode"]
		opponent = event["opponent"]
		logging.info(f"Matchmaking: match_details: Match found for {self.user.username} in {game} against {opponent} in room {roomCode}.")
		# send match data to client
		await self.send(text_data=json.dumps({
			"match": "match_created",
			"opponent": opponent,
			"game": game,
			"roomCode": roomCode,
		}))
		# chat warning for self
		await self.channel_layer.group_send(
			self.user_group_name, {
				"type": "system.message", "message": f"Match found! Starting a game of {game} against {opponent}"
			}
		)


	# utility methods
	async def get_game_from_data(self, data):
		game = data.get("game", None)
		if not game:
			logging.error("Matchmaking: get_game_from_data: No game provided.")
			return None
		elif game == "pong":
			return "pong"
		elif game == "snake":
			return "snake"
		else:
			logging.error("Matchmaking: get_game_from_data: Invalid game.")
			return None


	async def get_user_rank(self):
		xp = await self.get_user_xp()
		if xp is None:
			logging.error("Matchmaking: get_user_rank: Failed to get user xp.")
			return None
		max_rank = 50
		xp_max = 100_000  # xp required for max rank
		xpByRank = [0] * max_rank
		# xp required for each rank
		for rank in range(1, max_rank):
			# progressive xp requirement based on rank (quadratic)
			xpByRank[rank] = int((rank / max_rank) ** 2 * xp_max)
		# rank based on xp
		for rank, xp_required in enumerate(xpByRank):
			if xp < xp_required:
				return rank - 1
		return max_rank


	async def get_user_xp(self):
		url = f'http://userapi:8000/profile/get_user_profile/?username={self.user.username}'
		headers = {
			'Authorization': f'Bearer {self.token}',
		}
		try:
			async with httpx.AsyncClient() as client:
				response = await client.get(url, headers=headers)
				if response.status_code == 200:
					data = response.json()
					return data.get(f'{self.game}_rank', 0)
				else:
					logging.error(f"Matchmaking: get_user_xp: Failed to get rank: {response.status_code} {response.text}")
					return None
		except httpx.RequestError as e:
			logging.error(f"Matchmaking: get_user_xp: An error occurred while requesting user xp: {e}")
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
			logging.error("Matchmaking: valide_token: No token provided.")
			return None
		try:
			access_token = AccessToken(token)
			return access_token
		except (InvalidToken, TokenError):
			logging.error("Matchmaking: validate_token: Invalid token.")
			return None


	async def initialize_connection(self):
		# chat group
		self.user_group_name = "user_%s" % self.user.username
		# matchmaking group
		self.user_mm_group_name = "user_mm_%s" % self.user.username
		# accepting the websocket connection
		await self.accept()
		await self.channel_layer.group_add(self.user_mm_group_name, self.channel_name)
		logging.info(f"Matchmaking: initialize_connection: User {self.user.username} connected.")
		self.authenticated = True


	async def cleanup_connection(self):
		if self.game:
			logging.info(f"Matchmaking: cleanup_connection: Cleaning up player {self.user.username} from game {self.game}.")
			await matchmaking_manager.cancel_matchmaking(self.user.username, self.game)
		await self.channel_layer.group_discard(self.user_mm_group_name, self.channel_name)


async def create_room(game_accessToken, authorized_user):
	data = None

	logger.info(f"Matchmaking: create_room: Creating room for {authorized_user}")
	logger.info(f"Matchmaking: create_room: Game Access Token: {game_accessToken}")

	try:
		async with httpx.AsyncClient() as client:
			response = await client.post(
				'http://gameserver:8001/create-room/',
				headers={
					'Content-Type': 'application/json',
					'Authorization': f'Bearer {game_accessToken}',
				},
				json={
					'authorized_user': authorized_user
				},
			)
			data = response.json()
			logger.info(f"CreateRoom: {data}")

			if response.status_code != 200:
				logger.error(f"Matchmaking: create_room: Error: {data}")

	except Exception as e:
		logger.info(f'Matchmaking: create_room: Error creating room: {e}')

	return data.get('code') if data else None


class ChatConsumer(AsyncWebsocketConsumer):
	MAX_MESSAGE_LENGTH = 200
	online_users = {} #dict of online users
	inviting = False # inviting status
	pending = [] # pending invites


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
		self.inviting = False
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
		logging.info(f"Chat: handle_cancel_invite: Invite to {recipient} canceled by {self.user.username}.")


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
			self.inviting = True
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
			roomCode = await create_room(self.token, inviter)
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
		if not message or message > self.MAX_MESSAGE_LENGTH:
			logging.info("Chat: handle_private_message: Message not send because it is too big.")
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
		if not message or message > self.MAX_MESSAGE_LENGTH:
			logging.info("Chat: handle_public_message: Message not send because it is too big.")
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
			logging.error("Chat: receive_dm: Failed to get blocked users list.")
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
		if self.inviting is False:
			logging.error("Chat: invite_response: This invite was canceled previously, not doing anything")
			return
		invitee = event["invitee"]
		accepted = event["accepted"]
		game = event.get("game", "a game")
		roomCode = event.get("roomCode", None)
		self.inviting = False
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
			"message": f"Invite from {sender} has been cancelled."
		}))
		self.pending.remove(sender)

	async def update_status(self, event):
		online_users = event['online_users']

		await self.send(text_data=json.dumps({
			'online_users': online_users
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
		# adding user to channel groups and online list
		await self.channel_layer.group_add(self.room_group_name, self.channel_name)
		await self.channel_layer.group_add(self.user_group_name, self.channel_name)
		await self.add_online_user()


	async def cleanup_connection(self):
		await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
		await self.channel_layer.group_discard(self.user_group_name, self.channel_name)
		await self.remove_online_user()
		logging.info(f"Chat: cleanup_connection: User {self.user.username} disconnected.")


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
