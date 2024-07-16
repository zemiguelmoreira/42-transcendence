import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'GameServer.settings')
django.setup()

from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import json
import time
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken
from urllib.parse import parse_qs
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async

User = get_user_model()

class PongConsumer(AsyncWebsocketConsumer):
    rooms = {}

    async def connect(self):
        query_params = parse_qs(self.scope['query_string'].decode())
        self.token = query_params.get('token', [None])[0]
        self.authorized_user = query_params.get('authorized_user', [None])[0]
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.is_player = False

        try:
            access_token = AccessToken(self.token)
            user_id = access_token['user_id']
            self.user = await self.get_user(user_id)
            if not self.user:
                await self.close()
                return

            await self.accept()
        except (InvalidToken, TokenError):
            await self.close()
            return

        if self.room_name not in PongConsumer.rooms:
            PongConsumer.rooms[self.room_name] = {
                'players': [],
                'spectators': [],
                'ball_position': [400, 300],
                'paddle_positions': [[10, 250], [780, 250]],
                'ball_velocity': [300, 300],
                'current_directions': ['idle', 'idle'],
                'paddle_speed': 250,
                'authorized_user': self.authorized_user
            }

        room = PongConsumer.rooms[self.room_name]

        if len(room['players']) < 2 and self.user.username == room['authorized_user']:
            self.is_player = True
            room['players'].append(self)
            player_index = room['players'].index(self)

            await self.send(json.dumps({
                'action': 'assign_index',
                'player_index': player_index,
                'ball_position': room['ball_position'],
                'paddle_positions': room['paddle_positions']
            }))
        else:
            room['spectators'].append(self)

        if len(room['players']) == 2:
            await self.send(json.dumps({'action': 'start_game'}))
            if not hasattr(room, 'game_loop_task'):
                room['game_loop_task'] = asyncio.create_task(self.game_loop(room))

    async def disconnect(self, close_code):
        room = PongConsumer.rooms.get(self.room_name, None)

        if room:
            if self.is_player and self in room['players']:
                room['players'].remove(self)
            elif self in room['spectators']:
                room['spectators'].remove(self)

            if not room['players'] and hasattr(room, 'game_loop_task') and room['game_loop_task']:
                room['game_loop_task'].cancel()
                room['game_loop_task'] = None

    async def receive(self, text_data):
        data = json.loads(text_data)

        if self.is_player and 'action' in data:
            if data['action'] == 'move':
                player_index = data['player_index']
                direction = data['direction']
                PongConsumer.rooms[self.room_name]['current_directions'][player_index] = direction

    async def game_loop(self, room):
        last_time = time.time()

        while room['players']:
            current_time = time.time()
            delta_time = current_time - last_time
            last_time = current_time
            
            self.update_game_state(room, delta_time)
            await asyncio.sleep(0.02)

    def update_game_state(self, room, delta_time):
        room['ball_position'][0] += room['ball_velocity'][0] * delta_time
        room['ball_position'][1] += room['ball_velocity'][1] * delta_time

        if room['ball_position'][1] <= 0 or room['ball_position'][1] >= 600:
            room['ball_velocity'][1] *= -1
        if room['ball_position'][0] <= 0 or room['ball_position'][0] >= 800:
            room['ball_velocity'][0] *= -1
        
        for i in range(len(room['paddle_positions'])):
            direction = room['current_directions'][i]
            if direction == 'up':
                room['paddle_positions'][i][1] = max(room['paddle_positions'][i][1] - room['paddle_speed'] * delta_time, 0)
            elif direction == 'down':
                room['paddle_positions'][i][1] = min(room['paddle_positions'][i][1] + room['paddle_speed'] * delta_time, 600 - 100)

        response = {
            'ball_position': room['ball_position'],
            'paddle_positions': room['paddle_positions']
        }

        for player in room['players']:
            asyncio.create_task(player.send(json.dumps(response)))

    async def get_user(self, user_id):
        try:
            user = await database_sync_to_async(User.objects.get)(pk=user_id)
            return user
        except User.DoesNotExist:
            return None
