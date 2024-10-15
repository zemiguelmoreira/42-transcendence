import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'GameServer.settings')
django.setup()

from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import json
import time
from datetime import datetime, timezone
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken
from urllib.parse import parse_qs
from GameServer.utils import is_authenticated, get_room, check_user_access
import logging
import httpx


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

canvasHeight = 560
canvasWidth = 960
PADDLE_WIDTH = 20
PADDLE_HEIGHT = 90
BALL_SIZE = 10
FINAL_SCORE = 10

paddles_init_y = 310 - 62
paddle1_init_x = 0
paddle2_init_x = canvasWidth - PADDLE_WIDTH

ball_init_x = canvasWidth / 2 - BALL_SIZE / 2
ball_init_y = canvasHeight / 2 - BALL_SIZE / 2


def is_goal_paddle1(ball_x):
    return ball_x + BALL_SIZE >= canvasWidth

def is_goal_paddle2(ball_x):
    return ball_x <= 0


def is_collision_paddle1(ball_x, ball_y, paddle_y):
    return (ball_x <= PADDLE_WIDTH and ball_y + BALL_SIZE >= paddle_y and ball_y <= paddle_y + PADDLE_HEIGHT)


def is_collision_paddle2(ball_x, ball_y, paddle_y):
    return (ball_x + BALL_SIZE >= canvasWidth - PADDLE_WIDTH and ball_y + BALL_SIZE >= paddle_y and ball_y <= paddle_y + PADDLE_HEIGHT)

class PongConsumer(AsyncWebsocketConsumer):
    rooms = {}

    async def connect(self):
        query_params = parse_qs(self.scope['query_string'].decode())
        room_code = self.scope['url_route']['kwargs'].get('room_code', None)
        self.token = query_params.get('token', [None])[0]
        self.is_player = False

        user = await is_authenticated(self.token)
        if not user:
            await self.close()
            return

        self.user = user

        room = await get_room(room_code)
        if not room:
            await self.close()
            return

        self.room = room
        is_auth = await check_user_access(self.room, self.user)
        logger.info(f'is auth: {is_auth}')
        if not is_auth:
            logger.info(f'User {user.username} do not have access to {self.room.code}')
            await self.close()
            return

        await self.accept()
        logger.info(f'User {user.username} connected to room {self.room.code}')

        if self.room.code not in PongConsumer.rooms:
            PongConsumer.rooms[self.room.code] = {
                'players': [],
                'paddles': [{'username': "", 'alive': True },{ 'username': "", 'alive': True }],
                'ball_position': [ball_init_x, ball_init_y],
                'paddle_positions': [[paddle1_init_x, paddles_init_y], [paddle2_init_x, paddles_init_y]],
                'ball_velocity': [500, 500],
                'current_directions': ['idle', 'idle'],
                'score': [0, 0],
                'paddle_speed': 800,
                'wall_collision': False
            }

        room = PongConsumer.rooms[self.room.code]

        for player in room['players']:
            if player.user.id == self.user.id:
                await self.close()
                return


        if len(room['players']) < 2 and self not in room['players']:
            self.is_player = True
            room['players'].append(self)
            player_index = room['players'].index(self)
            room['paddles'][player_index]['username'] = self.user.username

            await self.send(json.dumps({
                'action': 'assign_index',
                'player_index': player_index,
                'ball_position': room['ball_position'],
                'paddle_positions': room['paddle_positions'],
                'score': room['score']
            }))

        if len(room['players']) == 2:
            for player in room['players']:
                logger.info(f'Player {player.user.username} is ready')
                await player.send(json.dumps({
                    'action': 'start_game',
                    'player_index': player_index,
                    'player_names': [room['players'][0].user.username, room['players'][1].user.username],
                    'ball_position': room['ball_position'],
                    'paddle_positions': room['paddle_positions'],
                    'score': room['score']
                }))
            if 'game_loop_task' not in room:
                room['game_loop_task'] = asyncio.create_task(self.game_loop(room))
        else:
            await self.send(json.dumps({
                    'action': 'wait_for_player',
                    'player_index': player_index,
                    'ball_position': room['ball_position'],
                    'paddle_positions': room['paddle_positions'],
                    'score': room['score']
                }))

    async def disconnect(self, close_code):
        logger.info(f'Disconnected: {self.user.username}')

        # Verificar se a sala ainda existe
        room = PongConsumer.rooms.get(self.room.code)  # Tenta obter a sala de forma segura
        if room:
            player_index = None
            for i, player in enumerate(room['players']):
                if player.user.id == self.user.id:
                    player_index = i
                    break

            if player_index is not None:
                room['paddles'][player_index]['alive'] = False
                logger.info(f"Player {self.user.username}'s paddle is now dead due to disconnection.")

        
        if self.room.code in PongConsumer.rooms:
            room = PongConsumer.rooms[self.room.code]

            if self in room['players']:
                room['end_game'] = True
                loser = self.user.username
                winner = room['players'][0].user.username if room['players'][0].user.username != loser else room['players'][1].user.username
                
                logger.info(f'Calling end game')

                if 'game_loop_task' in room:
                    room['game_loop_task'].cancel()

                await self.end_game(room, winner, loser)

            # del PongConsumer.rooms[self.room.code]

        await self.close()



    async def receive(self, text_data):
        data = json.loads(text_data)

        if self.is_player and 'action' in data:
            if data['action'] == 'move':
                player_index = data['player_index']
                direction = data['direction']
                if PongConsumer.rooms[self.room.code]:
                    PongConsumer.rooms[self.room.code]['current_directions'][player_index] = direction

    async def game_loop(self, room):
        last_time = time.time()

        while room['players']:
            current_time = time.time()
            delta_time = current_time - last_time
            last_time = current_time
            # logger.info('update')
            # logger.info(f'players in room: {room["players"]}')

            
            await self.update_game_state(room, delta_time)
            await asyncio.sleep(0.008)  # Increase update frequency for smoother ball movement
        
        if not room['players']:
            if 'game_loop_task' in room:
                room['game_loop_task'].cancel()  # Cancela o loop do jogo
            del PongConsumer.rooms[self.room.code]  # Remove a sala

    async def update_game_state(self, room, delta_time):
        alive_paddles = [paddle for paddle in room['paddles'] if paddle['alive']]
        logger.info(f'paddles alive: {alive_paddles}')
        if len(alive_paddles) <= 1:
            if len(alive_paddles) == 1:
                logger.info(f'alive paddles == 1')
                for player in room['players']:
                    await player.end_game(room, alive_paddles[0]['username'])
            return

        room['ball_position'][0] += room['ball_velocity'][0] * delta_time
        room['ball_position'][1] += room['ball_velocity'][1] * delta_time

        # wall collision
        if not room['wall_collision'] and (room['ball_position'][1] <= 0  or room['ball_position'][1] + BALL_SIZE >= canvasHeight):
            room['ball_velocity'][1] *= -1
            room['wall_collision'] == True
        
        #reset collision flag
        if room['ball_position'][1] > BALL_SIZE + 1 and room['ball_position'][1] < canvasHeight - BALL_SIZE - 1:
            room['wall_collision'] == False
        
        if is_goal_paddle1(room['ball_position'][0]):
            room['score'][0] += 1
            room['ball_position'] = [ball_init_x, ball_init_y]
            room['ball_velocity'][0] *= -1
            logger.info("Gol do paddle 1")
        if is_goal_paddle2(room['ball_position'][0]):
            room['score'][1] += 1
            room['ball_position'] = [ball_init_x, ball_init_y]
            room['ball_velocity'][0] *= -1
            logger.info("Gol do paddle 2")

        # Colisões com os paddles
        if room['ball_velocity'][0] < 0 and is_collision_paddle1(room['ball_position'][0], room['ball_position'][1], room['paddle_positions'][0][1]):
            room['ball_velocity'][0] *= -1
            logger.info("Colidiu paddle 1")
        if room['ball_velocity'][0] > 0 and is_collision_paddle2(room['ball_position'][0], room['ball_position'][1], room['paddle_positions'][1][1]):
            room['ball_velocity'][0] *= -1
            logger.info("colidiu paddle 2")

        for i in range(len(room['paddle_positions'])):
            direction = room['current_directions'][i]
            if direction == 'up':
                room['paddle_positions'][i][1] = max(room['paddle_positions'][i][1] - room['paddle_speed'] * delta_time, 0)
            elif direction == 'down':
                room['paddle_positions'][i][1] = min(room['paddle_positions'][i][1] + room['paddle_speed'] * delta_time, canvasHeight - PADDLE_HEIGHT)

        response = {
            'action': 'update_game_state',
            'ball_position': room['ball_position'],
            'paddle_positions': room['paddle_positions'],
            'score': room['score']
        }

        for player in room['players']:
            asyncio.create_task(player.send(json.dumps(response)))
            
        # Verificar se o jogo terminou pelo placar
        if room['score'][0] == FINAL_SCORE or room['score'][1] == FINAL_SCORE:
        if room['score'][0] == FINAL_SCORE or room['score'][1] == FINAL_SCORE:
            logger.info(f"Game finished by reaching final score: {room['score'][0]} - {room['score'][1]}")
            if room['score'][0] == FINAL_SCORE:
                room['paddles'][1]['alive'] = False
            else:
                room['paddles'][0]['alive'] = False
            

    async def end_game(self, room, winner):
        logger.info('function end_game called')
        
        loser = room['players'][0].user.username if room['players'][0].user.username != winner else room['players'][1].user.username
        
        
        logger.info(f'winner: {winner}')
        logger.info(f'loser: {loser}')
        
        winner_score = room['score'][0] if room['players'][0].user.username == winner else room['score'][1]
        loser_score = room['score'][0] if room['players'][0].user.username != winner else room['score'][1]

        timestamp = int(time.time())
        formatted_time = datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()

        result = {
            'action': 'game_over',
            'winner': winner,
            'loser': loser,
            'winner_score': winner_score,
            'loser_score': loser_score,
            'timestamp': formatted_time,  # Adicionando timestamp
            'game_type': 'pong'
        }

        to_save = {
            'winner': winner,
            'loser': loser,
            'winner_score': winner_score,
            'loser_score': loser_score,
            'timestamp': formatted_time,  # Adicionando timestamp
            'game_type': 'pong',
            'ranked': True
        }

        # Salvar partida no banco de dados
        if winner == self.user.username:
            for player in room['players']:
                await player.save_match_history(to_save)
                await player.send(json.dumps(result))
            room['players'].clear()  # Limpa a lista de jogadores
        


    async def save_match_history(self, match_data):
        url = 'http://userapi:8000/profile/update_match_history/'   
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.token}',
        }
        logger.info(f'self username: {self.user.username}')
        logger.info(f'self token: {self.token}')
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=match_data, headers=headers)
                response.raise_for_status()  # Levanta exceções para códigos de status de erro
                logger.info(f"Match history saved successfully: {response.json()}")
        except httpx.HTTPStatusError as http_err:
            logger.error(f"HTTP error occurred: {http_err}")
        except Exception as err:
            logger.error(f"Other error occurred: {err}")