import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'GameServer.settings')
django.setup()

from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import json
import time
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken
from urllib.parse import parse_qs
from GameServer.utils import is_authenticated, get_room, check_user_access
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PongConsumer(AsyncWebsocketConsumer):
    rooms = {}

    async def connect(self):
        query_params = parse_qs(self.scope['query_string'].decode())
        room_code = self.scope['url_route']['kwargs'].get('room_code', None)
        token = query_params.get('token', [None])[0]

        user = await is_authenticated(token)
        if not user:
            await self.close()
            return

        self.user = user

        room = await get_room(room_code)
        if not room:
            await self.close()
            return

        self.room = room
        
        if not check_user_access(self.room, self.user):
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room.code,
            self.channel_name
        )

        await self.accept()
        logger.info(f'User {user.username} connected to room {self.room.code}')

        if self.room.code not in PongConsumer.rooms:
            PongConsumer.rooms[self.room.code] = {  
                'players': [],
                'ball_position': [400, 300],
                'paddle_positions': [[10, 250], [780, 250]],
                'ball_velocity': [300, 300],
                'current_directions': ['idle', 'idle'],
                'score': [0, 0],
                'paddle_speed': 250,
            }

        room = PongConsumer.rooms[self.room.code]

        if len(room['players']) < 2:
            self.is_player = True
            room['players'].append(self)
            player_index = room['players'].index(self)

            await self.send(json.dumps({
                'action': 'assign_index',
                'player_index': player_index,
                'ball_position': room['ball_position'],
                'paddle_positions': room['paddle_positions']
            }))

        if len(room['players']) == 2:
            await self.channel_layer.group_send(
                self.room.code,
                {
                    'type': 'start_game',
                    'action': 'start_game'
                }
            )
            if not hasattr(room, 'game_loop_task'):
                room['game_loop_task'] = asyncio.create_task(self.game_loop(room))


    async def disconnect(self, close_code):
        room = PongConsumer.rooms.get(self.room.code, None)

        if room:
            if self.is_player and self in room['players']:
                room['players'].remove(self)

            if not room['players'] and hasattr(room, 'game_loop_task') and room['game_loop_task']:
                room['game_loop_task'].cancel()
                room['game_loop_task'] = None
            
            await self.channel_layer.group_discard(
                self.room.code,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)

        if self.is_player and 'action' in data:
            if data['action'] == 'move':
                player_index = data['player_index']
                direction = data['direction']
                PongConsumer.rooms[self.room.code]['current_directions'][player_index] = direction

    async def game_loop(self, room):
        last_time = time.time()

        while room['players']:
            current_time = time.time()
            delta_time = current_time - last_time
            last_time = current_time
            
            await self.update_game_state(room, delta_time)
            await asyncio.sleep(0.03)

    async def update_game_state(self, room, delta_time):
        room['ball_position'][0] += room['ball_velocity'][0] * delta_time
        room['ball_position'][1] += room['ball_velocity'][1] * delta_time

        if room['ball_position'][1] <= 0 or room['ball_position'][1] >= 600:
            room['ball_velocity'][1] *= -1
        if room['ball_position'][0] < -10:
            room['score'][1] += 1
            room['ball_position'] = [400, 300]
            room['ball_velocity'][0] *= -1
        if room['ball_position'][0] > 810:
            room['score'][0] += 1
            room['ball_position'] = [400, 300]
            room['ball_velocity'][0] *= -1 # change the direction on x

        # Colisões com os paddles
        if room['ball_velocity'][0] < 0 and room['ball_position'][0] <= 20:
            if room['paddle_positions'][0][1] <= room['ball_position'][1] <= room['paddle_positions'][0][1] + 100:
                room['ball_velocity'][0] *= -1
        elif room['ball_velocity'][0] > 0 and room['ball_position'][0] >= 780:
            if room['paddle_positions'][1][1] <= room['ball_position'][1] <= room['paddle_positions'][1][1] + 100:
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

        # Verificar se o jogo terminou
        if room['score'][0] == 11 or room['score'][1] == 11:
            logger.info(f"Detectou fim de partida {room['score'][0]} - {room['score'][1]}")
            if room['score'][0] == 11:
                winner = room['players'][0].user.username
                loser =  room['players'][1].user.username
            else:
                loser = room['players'][0].user.username
                winner =  room['players'][1].user.username

            logger.info(f"winner and loser: {winner} - {loser}")
            await self.end_game(room, winner, loser)

    async def end_game(self, room, winner, loser):
        logger.info('function end_game called')
        winner_score = room['score'][0] if room['players'][0].user.username == winner else room['score'][1]
        loser_score = room['score'][1] if room['players'][0].user.username == winner else room['score'][0]
        result = {
            'action': 'game_over',
            'winner': winner,
            'loser': loser,
            'winner_score': winner_score,
            'loser_score': loser_score,
        }

        logger.info(f'result: {result}')
        logger.info(f"players: {room['players'][0].user.username} - {room['players'][1].user.username}")

        await self.channel_layer.group_send(
            self.room.code,
            {
                'type': 'game_over',
                'result': result
            }
        )
        
        # Limpar o estado da sala
        del PongConsumer.rooms[self.room.code]
