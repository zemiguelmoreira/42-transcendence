from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import json
import time
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken
from urllib.parse import parse_qs
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
import random
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

User = get_user_model()

class SnakeConsumer(AsyncWebsocketConsumer):
    rooms = {}

    async def connect(self):
        query_params = parse_qs(self.scope['query_string'].decode())
        self.token = query_params.get('token', [None])[0]
        self.authorized_user = query_params.get('authorized_user', [None])[0]
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.is_player = False
        self.player_index = -1

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

        if self.room_name not in SnakeConsumer.rooms:
            SnakeConsumer.rooms[self.room_name] = {
                'players': [],
                'spectators': [],
                'size': 20,
                'food': self.random_food_position(),
                'snakes': [[{'x': 60, 'y': 60}], [{'x': 740, 'y': 540}]],
                'directions': [None, None],
                'score': [0, 0],
                'game_speed': 200,
                'authorized_user': self.authorized_user,
                'game_loop_task': None
            }

        room = SnakeConsumer.rooms[self.room_name]

        if len(room['players']) == 0 or (len(room['players']) == 1 and self.user.username == room['authorized_user']):
            self.is_player = True
            room['players'].append(self)
            self.player_index = len(room['players']) - 1

            await self.send(json.dumps({
                'action': 'assign_index',
                'player_index': self.player_index,
                'food': room['food'],
                'snakes': room['snakes']
            }))
        else:
            room['spectators'].append(self)

        if len(room['players']) == 2:
            await self.send(json.dumps({'action': 'start_game'}))
            if not room['game_loop_task']:
                room['game_loop_task'] = asyncio.create_task(self.game_loop(room))

    async def disconnect(self, close_code):
        room = SnakeConsumer.rooms.get(self.room_name, None)

        if room:
            if self.is_player and self in room['players']:
                room['players'].remove(self)
            elif self in room['spectators']:
                room['spectators'].remove(self)

            if not room['players'] and room['game_loop_task']:
                room['game_loop_task'].cancel()
                room['game_loop_task'] = None

    async def receive(self, text_data):
        data = json.loads(text_data)

        if self.is_player and 'action' in data:
            if data['action'] == 'move':
                direction = data['direction']
                SnakeConsumer.rooms[self.room_name]['directions'][self.player_index] = direction

    async def game_loop(self, room):
        while room['players']:
            await self.update_game_state(room)
            await asyncio.sleep(room['game_speed'] / 1000)

    async def update_game_state(self, room):
        for i, snake in enumerate(room['snakes']):
            self.move_snake(snake, room['directions'][i])
            if self.check_collision(snake):
                await self.end_game(room, i)
                return

            if self.check_food_collision(snake, room['food']):
                room['score'][i] += 10
                room['food'] = self.random_food_position()
                snake.append(snake[-1].copy())  # Grow the snake

        response = {
            'food': room['food'],
            'snakes': room['snakes'],
            'score': room['score']
        }

        for player in room['players']:
            await player.send(json.dumps(response))

    def move_snake(self, snake, direction):
        if not direction:
            return

        head = snake[-1].copy()

        if direction == 'right':
            head['x'] += 20
        elif direction == 'left':
            head['x'] -= 20
        elif direction == 'down':
            head['y'] += 20
        elif direction == 'up':
            head['y'] -= 20

        snake.append(head)
        snake.pop(0)

    def check_collision(self, snake):
        head = snake[-1]
        if head['x'] < 0 or head['x'] >= 800 or head['y'] < 0 or head['y'] >= 600:
            return True
        return any(segment == head for segment in snake[:-1])

    def check_food_collision(self, snake, food):
        head = snake[-1]
        return head['x'] == food['x'] and head['y'] == food['y']

    def random_food_position(self):
        return {
            'x': random.randint(0, 39) * 20,
            'y': random.randint(0, 29) * 20,
            'color': self.random_color()
        }

    def random_color(self):
        return f'rgb({random.randint(0, 255)}, {random.randint(0, 255)}, {random.randint(0, 255)})'

    async def end_game(self, room, losing_player_index):
        winner_index = 1 - losing_player_index
        result = {
            'action': 'game_over',
            'winner': room['players'][winner_index].user.username,
            'loser': room['players'][losing_player_index].user.username,
            'winner_score': room['score'][winner_index],
            'loser_score': room['score'][losing_player_index],
        }

        for player in room['players']:
            await player.send(json.dumps(result))

        del SnakeConsumer.rooms[self.room_name]

    async def get_user(self, user_id):
        try:
            user = await database_sync_to_async(User.objects.get)(pk=user_id)
            return user
        except User.DoesNotExist:
            return None
