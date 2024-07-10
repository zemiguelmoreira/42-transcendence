import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        pass
     
    async def disconnect(self):
        pass

    async def receive(self):
        pass
    
    async def send(self):
        pass