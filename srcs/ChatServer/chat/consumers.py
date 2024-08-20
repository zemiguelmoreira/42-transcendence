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
		# Extraindo o token da query string e validando-o
		self.token = self.scope['query_string'].decode().split('=')[1]

		# Tentando validar o token e obter o usuário
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

		# Configurando os grupos do canal de WebSocket
		self.room_name = 'all'
		self.room_group_name = "chat_%s" % self.room_name
		self.user_group_name = "user_%s" % self.user.username

		# Aceitando a conexão WebSocket
		await self.accept()
		self.authenticated = True

		# Gerenciando o estado dos usuários online
		if self.user.username not in self.online_users:
			self.online_users[self.user.username] = 1
		else:
			self.online_users[self.user.username] += 1

		# Adicionando o usuário aos grupos de canal
		await self.channel_layer.group_add(self.room_group_name, self.channel_name)
		await self.channel_layer.group_add(self.user_group_name, self.channel_name)

		# Enviando uma mensagem de atualização do status dos usuários online para todos
		await self.channel_layer.group_send(
			self.room_group_name,
			{
				'type': 'update.status',
				'online_users': sorted(list(self.online_users))
			}
		)

		# Enviando uma mensagem de boas-vindas ao usuário recém-conectado
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

		# Removendo o usuário dos grupos de canal
		await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
		await self.channel_layer.group_discard(self.user_group_name, self.channel_name)

		# Atualizando o estado dos usuários online
		if self.online_users[self.user.username] > 1:
			self.online_users[self.user.username] -= 1
		elif self.online_users[self.user.username] == 1:
			del self.online_users[self.user.username]
			await self.channel_layer.group_send(
				self.room_group_name,
				{
					'type': 'update.status',
					'online_users': sorted(list(self.online_users))
				}
			)
		return

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json.get("message", None)
		recipient = text_data_json.get("recipient", None)
		msgtype = text_data_json.get("type", None)
		game = text_data_json.get("game", None)  # Captura o nome do jogo
		roomCode = text_data_json.get("roomCode", None)  # Captura o código da sala

		# Se for um convite para jogo
		if msgtype == "invite":
			if not recipient or recipient == self.user.username:
				await self.channel_layer.group_send(
					self.user_group_name, {"type": "error.message", "message": "Invite a valid user."}
				)
				return

			if self.invited.get(recipient, False):
				await self.channel_layer.group_send(
					self.user_group_name, {"type": "error.message", "message": "User already has an invite pending."}
				)
				return
			if self.invited.get(self.user.username, False):
				await self.channel_layer.group_send(
					self.user_group_name, {"type": "error.message", "message": "You already have an invite pending."}
				)
				return
			self.invited[recipient] = True
			self.invited[self.user.username] = True
			recipient_group_name = "user_%s" % recipient
			await self.channel_layer.group_send(
				recipient_group_name, {
					"type": "invite.message",
					"sender": self.user.username,
					"game": game,  # Inclui o nome do jogo na mensagem
					"roomCode": roomCode,  # Inclui o código da sala na mensagem
				}
			)
			return

		elif msgtype == "invite_response":
			inviter = text_data_json.get("inviter", None)
			accepted = text_data_json.get("accepted", False)
			inviter_group_name = "user_%s" % inviter
			await self.channel_layer.group_send(
				inviter_group_name, {
					"type": "invite.response",
					"invitee": self.user.username,
					"accepted": accepted,
					"game": game  # Inclui o nome do jogo na resposta
				}
			)
			self.invited[self.user.username] = False
			self.invited[inviter] = False
			return

		# Se for uma mensagem pública
		if not recipient:
			await self.channel_layer.group_send(
				self.room_group_name, {"type": "chat.message", "message": message, "sender": self.user.username}
			)
			return

		# Se for uma mensagem privada
		recipient_group_name = "user_%s" % recipient
		if recipient == self.user.username:
			await self.channel_layer.group_send(
				recipient_group_name, {"type": "self.dm", "message": message}
			)
			return
		# Enviando para o destinatário
		await self.channel_layer.group_send(
			recipient_group_name, {"type": "receive.dm", "message": message, "sender": self.user.username}
		)
		# Enviando confirmação para o remetente
		await self.channel_layer.group_send(
			self.user_group_name, {"type": "send.dm", "message": message, "dest": recipient}
		)

		# Print the token to the terminal
		# print(self.token)

	async def chat_message(self, event):
		message = event["message"]
		sender = event["sender"]
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
		game = event.get("game", None)  # Obtém o nome do jogo, com valor padrão
		roomCode = event.get("roomCode", None)  # Obtém o código da sala, com valor padrão

		await self.send(text_data=json.dumps({
			"invite": True,
			"sender": sender,
			"game": game,  # Inclui o nome do jogo na mensagem enviada ao cliente
			"roomCode": roomCode  # Inclui o código da sala na mensagem enviada ao cliente
		}))

	async def invite_response(self, event):
		invitee = event["invitee"]
		accepted = event["accepted"]
		game = event.get("game", "a game")  # Obtém o nome do jogo, com valor padrão

		await self.send(text_data=json.dumps({
			"invite_response": True,
			"invitee": invitee,
			"accepted": accepted,
			"game": game  # Inclui o nome do jogo na resposta enviada ao cliente
		}))

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
