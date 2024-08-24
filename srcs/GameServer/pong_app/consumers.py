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
PADDLE_WIDTH = 10
PADDLE_HEIGHT = 90
BALL_SIZE = 10

paddles_init_y = 310 - 62
paddle1_init_x = 0
paddle2_init_x = canvasWidth - PADDLE_WIDTH

ball_init_x = canvasWidth / 2 - BALL_SIZE / 2
ball_init_y = canvasHeight / 2 - BALL_SIZE / 2


def is_goal_paddle1(ball_x):
    return ball_x + BALL_SIZE >= canvasWidth

def is_goal_paddle2(ball_x):
    return ball_x <= 0


#    // Colisão da bola com os paddles
#     if (ballX <= paddleWidth && ballY + ballSize >= leftPaddleY && ballY <= leftPaddleY + paddleHeight) {
#         ballDirX *= -1;
#         leftPaddleSound.play();  // Som de colisão com o paddle esquerdo
#     }
#     if (ballX + ballSize >= canvasWidth - paddleWidth && ballY + ballSize >= rightPaddleY && ballY <= rightPaddleY + paddleHeight) {
#         ballDirX *= -1;
#         rightPaddleSound.play();  // Som de colisão com o paddle direito
#     }

def is_collision_paddle1(ball_x, ball_y, paddle_y):
    return (ball_x <= PADDLE_WIDTH and ball_y + BALL_SIZE >= paddle_y and ball_y <= paddle_y + PADDLE_HEIGHT)
    # collision_area_top = paddle_y
    # collision_area_bottom = paddle_y + PADDLE_HEIGHT
    # collision_area_left = paddle1_init_x
    # collision_area_right = paddle1_init_x + PADDLE_WIDTH

    # return (collision_area_left <= ball_x <= collision_area_right) and (collision_area_top <= ball_y <= collision_area_bottom)

def is_collision_paddle2(ball_x, ball_y, paddle_y):
    return (ball_x + BALL_SIZE >= canvasWidth - PADDLE_WIDTH and ball_y + BALL_SIZE >= paddle_y and ball_y <= paddle_y + PADDLE_HEIGHT)
    # collision_area_top = paddle_y
    # collision_area_bottom = paddle_y + PADDLE_HEIGHT
    # collision_area_left = paddle2_init_x
    # collision_area_right = paddle2_init_x + PADDLE_WIDTH

    # return (collision_area_left <= ball_x <= collision_area_right) and (collision_area_top <= ball_y <= collision_area_bottom)

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
                'ball_position': [ball_init_x, ball_init_y],
                'paddle_positions': [[paddle1_init_x, paddles_init_y], [paddle2_init_x, paddles_init_y]],
                'ball_velocity': [600, 600],
                'current_directions': ['idle', 'idle'],
                'score': [0, 0],
                'paddle_speed': 500,
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

            await self.send(json.dumps({
                'action': 'assign_index',
                'player_index': player_index,
                'ball_position': room['ball_position'],
                'paddle_positions': room['paddle_positions'],
                'score': room['score']
            }))

        if len(room['players']) == 2:
            for player in room['players']:
                await player.send(json.dumps({'action': 'start_game'}))
            if 'game_loop_task' not in room:
                room['game_loop_task'] = asyncio.create_task(self.game_loop(room))
        else:
            await self.send(json.dumps({'action': 'wait_for_player'}))

    async def disconnect(self, close_code):
        pass
        # room = PongConsumer.rooms.get(self.room.code, None)

        # if room:
        #     # if len(room['players']) == 1:
        #     #     winner = room['players'][0].user.username
        #     #     loser = self.user.username
        #     #     for player in room['players']:
        #     #         await player.end_game(room, winner, loser)

        #     if hasattr(self, 'is_player') and self.is_player and self in room['players']:
        #         room['players'].remove(self)

        #     if not room['players'] and 'game_loop_task' in room and room['game_loop_task']:
        #         room['game_loop_task'].cancel()
        #         room['game_loop_task'] = None

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
            await asyncio.sleep(0.02)  # Increase update frequency for smoother ball movement

    async def update_game_state(self, room, delta_time):
        room['ball_position'][0] += room['ball_velocity'][0] * delta_time
        room['ball_position'][1] += room['ball_velocity'][1] * delta_time

        if room['ball_position'][1] <= 0  or room['ball_position'][1] + BALL_SIZE >= canvasHeight:
            room['ball_velocity'][1] *= -1

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
            'ball_position': room['ball_position'],
            'paddle_positions': room['paddle_positions'],
            'score': room['score']
        }

        for player in room['players']:
            asyncio.create_task(player.send(json.dumps(response)))

        # Verificar se o jogo terminou
        if room['score'][0] ==11 or room['score'][1] == 11:
            logger.info(f"Detectou fim de partida {room['score'][0]} - {room['score'][1]}")
            if room['score'][0] == 11:
                winner = room['players'][0].user.username
                loser = room['players'][1].user.username
            else:
                loser = room['players'][0].user.username
                winner = room['players'][1].user.username

            logger.info(f"winner and loser: {winner} - {loser}")
            for player in room['players']:
                await player.end_game(room, winner, loser)

    async def end_game(self, room, winner, loser):
        logger.info('function end_game called')
        winner_score = room['score'][0] if room['players'][0].user.username == winner else room['score'][1]
        loser_score = room['score'][1] if room['players'][0].user.username == winner else room['score'][0]
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
            'game_type': 'pong'
        }

        # Salvar partida no banco de dados
        # PARA CORRIGIR SO SALVA NO PLAYER QUE FICA ONLINE

        await self.save_match_history(to_save) 

        # Enviar resultado para todos os jogadores
        for player in room['players']:
            await player.send(json.dumps(result))

        # Limpar o estado da sala
        await self.close()
        del PongConsumer.rooms[self.room.code]

    async def save_match_history(self, match_data):
        url = 'http://userapi:8000/profile/update_match_history/'
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.token}',
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=match_data, headers=headers)
                response.raise_for_status()  # Levanta exceções para códigos de status de erro
                logger.info(f"Match history saved successfully: {response.json()}")
        except httpx.HTTPStatusError as http_err:
            logger.error(f"HTTP error occurred: {http_err}")
        except Exception as err:
            logger.error(f"Other error occurred: {err}")
