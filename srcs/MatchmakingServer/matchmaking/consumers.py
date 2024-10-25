import json
import os
import django
from django.conf import settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'MatchmakingServer.settings')
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
		if self.game:
			logging.error("Matchmaking: join_matchmaking: User already in matchmaking.")
			return
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
		game = data.get("game", self.game)
		logging.info(f"Matchmaking: cancel_matchmaking: User {self.user.username} left {game} matchmaking.")
		await matchmaking_manager.cancel_matchmaking(self.user.username)
		await matchmaking_manager.remove_player(self.user.username, game)
		self.game = None


	# event handlers
	# cancel if started game from chat (handled from url change on frontend)
	# async def chat_cancel(self, event):
		# logging.info(f"Matchmaking: chat_cancel: User {self.user.username} started a game from chat. Cancelling matchmaking for {self.game}.")
		# await self.cancel_matchmaking()


	async def match_notFound(self, event):
		logging.info(f"Matchmaking: match_notFound: Match not found for {self.user.username} in {self.game}. Rejoining matchmaking.")
		await self.matchmake()


	# match found from matchmaking manager
	async def match_found(self, event):
		game = event["game"]
		opponent = event["opponent"]
		roomCode = await self.create_room(self.token, opponent)
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
		# await self.channel_layer.group_send(
		# 	self.user_group_name, {
		# 		"type": "system.message",
		# 		"message": f"Match found! Starting a game of {self.game} against {opponent}"
		# 	}
		# )
		# send match data to client
		await self.send(text_data=json.dumps({
			"match": "match_created",
			"opponent": opponent,
			"game": game,
			"roomCode": roomCode,
		}))
		self.game = None
		# await self.close()


	# match info from host
	async def match_details(self, event):
		game = event["game"]
		roomCode = event["roomCode"]
		opponent = event["opponent"]
		await matchmaking_manager.cancel_matchmaking(self.user.username)
		logging.info(f"Matchmaking: match_details: Match found for {self.user.username} in {game} against {opponent} in room {roomCode}.")
		# chat warning for self
		# await self.channel_layer.group_send(
		# 	self.user_group_name, {
		# 		"type": "system.message", "message": f"Match found! Starting a game of {game} against {opponent}"
		# 	}
		# )
		# send match data to client
		await self.send(text_data=json.dumps({
			"match": "match_created",
			"opponent": opponent,
			"game": game,
			"roomCode": roomCode,
		}))
		self.game = None
		# await self.close()


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
		# logger.info(f"Matchmaking: get_user_rank: User {self.user.username} has xp {xp}")
		if xp is None:
			return None
		max_rank = 25
		xp_max = await self.get_rankone()  # xp required for max rank
		if xp_max is None:
			return None
		elif xp_max < 5000:
			xp_max = 5000
		xpByRank = [0] * max_rank
		# xp required for each rank
		for rank in range(1, max_rank):
			# progressive xp requirement based on rank (quadratic)
			xpByRank[rank] = int((rank / max_rank) ** 2 * xp_max)
		# rank based on xp
		for rank, xp_required in enumerate(xpByRank):
			if xp < xp_required:
				# logger.info(f"Matchmaking: get_user_rank: User {self.user.username} has rank {rank}")
				if rank == 0:
					return 0
				return rank - 1
		return max_rank


	async def get_rankone(self):
		url = f"https://nginx/api/profile/{self.game}_rankings/"
		headers = {
			'Authorization': f'Bearer {self.token}',
		}
		try:
			async with httpx.AsyncClient(verify=False) as client:
				response = await client.get(url, headers=headers)
				if response.status_code == 200:
					data = response.json()
					try:
						rankone = data[f'{self.game}_rankings'][0].get(f'{self.game}_rank', 5000)
						return rankone
					except (KeyError, IndexError) as e:
						logger.error(f"Matchmaking: get_rankone: Error parsing rank data: {e}")
						return None
				else:
					logging.error(f"Matchmaking: get_rankone: Failed to get rank 1: {response.status_code} {response.text}")
					return None
		except httpx.RequestError as e:
			logging.error(f"Matchmaking: get_rankone: An error occurred while requesting rank 1: {e}")
			return None

	async def get_user_xp(self):
		url = f"https://nginx/api/profile/get_user_profile/?username={self.user.username}"
		headers = {
			'Authorization': f'Bearer {self.token}',
		}
		try:
			async with httpx.AsyncClient(verify=False) as client:
				response = await client.get(url, headers=headers)
				if response.status_code == 200:
					data = response.json()
					if data and 'profile' in data:
						return data['profile'].get(f'{self.game}_rank', 0)
					else:
						logging.error(f"Matchmaking: get_user_xp: Invalid data received: {data}")
						return None
				else:
					logging.error(f"Matchmaking: get_user_xp: Failed to get rank: {response.status_code} {response.text}")
					return None
		except httpx.RequestError as e:
			logging.error(f"Matchmaking: get_user_xp: An error occurred while requesting user xp: {e}")
			return None

	async def get_user_xp(self):
		url = f"https://nginx/api/profile/get_user_profile/?username={self.user.username}"
		headers = {
			'Authorization': f'Bearer {self.token}',
		}
		try:
			async with httpx.AsyncClient(verify=False) as client:
				response = await client.get(url, headers=headers)
				if response.status_code == 200:
					data = response.json()
					# logger.info(f"Matchmaking: get_user_xp: User {self.user.username} has xp {data}")
					return data['profile'].get(f'{self.game}_rank', 0)
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
			logging.error("Matchmaking: validate_token: No token provided.")
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
		self.game = None # coz of cleanup connection


	async def cleanup_connection(self):
		await self.channel_layer.group_discard(self.user_mm_group_name, self.channel_name)
		if self.game:
			logging.info(f"Matchmaking: cleanup_connection: Cleaning up player {self.user.username} from game {self.game}.")
			await matchmaking_manager.remove_player(self.user.username, self.game)
			await matchmaking_manager.cancel_matchmaking(self.user.username)


	async def create_room(self, game_accessToken, authorized_user):
		data = None
		# logger.info(f"Matchmaking: create_room: Creating room for {authorized_user}")
		# logger.info(f"Matchmaking: create_room: Game Access Token: {game_accessToken}")
		try:
			async with httpx.AsyncClient(verify=False) as client:
				response = await client.post(
					f"https://nginx/game/create-room/",
					headers={
						'Content-Type': 'application/json',
						'Authorization': f'Bearer {game_accessToken}',
					},
					json={
						'authorized_user': authorized_user,
						'ranked': True,
					},
				)
				data = response.json()
				logger.info(f"CreateRoom: {data}")
				if response.status_code != 200:
					logger.error(f"Matchmaking: create_room: Error: {data}")
		except Exception as e:
			logger.info(f'Matchmaking: create_room: Error creating room: {e}')
		return data.get('code') if data else None
