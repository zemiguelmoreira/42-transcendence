import json
from django.contrib.auth.models import get_user_model
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from .models import Message

User = get_user_model()

class ChatConsumer(WebsocketConsumer):

	def fetch_messages(self, data):
		messages = Message.last_10_messages()
		content = {
			'messages': self.messages_to_json(messages)
		}
		self.send(text_data=json.dumps(content))

	def new_message(self, data):
		author = data['from']
		author_user = User.objects.filter(username=author)[0]
		message = Message.objects.create(
			author=author_user,
			content=data['message'])
		content = {
			'command': 'new_message',
			'message': self.message_to_json(message)
		}
		return self.send_chat_message(content)

	def messages_to_json(self, messages):
		result = []
		for message in messages:
			result.append(self.message_to_json(message))
		return result

	def message_to_json(self, message):
		return {
			'author': message.author.username,
			'content': message.content,
			'timestamp': str(message.timestamp)
		}

	commands = {
		'fetch_messages': fetch_messages,
		'new_message': new_message
	}

	def connect(self):
		self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
		self.room_group_name = f"chat_{self.room_name}"
		print(f"Connecting to room: {self.room_group_name}", flush=True)
		# Join room group
		async_to_sync(self.channel_layer.group_add)(
			self.room_group_name, self.channel_name
		)

		self.accept()

	def disconnect(self, close_code):
		print(f"Disconnecting from room: {self.room_group_name}", flush=True)
		# Leave room group
		async_to_sync(self.channel_layer.group_discard)(
			self.room_group_name, self.channel_name
		)

	# Receive message from WebSocket
	def receive(self, text_data):
		print(f"Received data: {text_data}", flush=True)
		text_data_json = json.loads(text_data)
		command = text_data_json.get('command')
		print(f"Received command: {command}", flush=True)
		if command in self.commands:
			self.commands[command](self, text_data_json)


	def send_chat_message(self, message):
		# Send message to room group
		async_to_sync(self.channel_layer.group_send)(
			self.room_group_name,
			{
				"type": "chat.message",
				"message": message
			}
		)

	def send_message(self, message):
		self.send(text_data=json.dumps(message))

	# Receive message from room group
	def chat_message(self, event):
		message = event["message"]
		print(f"Chat message received: {message}", flush=True)
		# Send message to WebSocket
		self.send(text_data=json.dumps({"message": message}))
