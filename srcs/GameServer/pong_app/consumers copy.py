import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'GameServer.settings')
django.setup()

import json
import asyncio
import logging
import time
import requests
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from datetime import datetime, timezone
from GameServer.utils import is_authenticated, get_room

# Configuração do logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constantes do jogo
canvasHeight = 560
canvasWidth = 960
PADDLE_WIDTH = 20
PADDLE_HEIGHT = 90
BALL_SIZE = 10
FINAL_SCORE = 10

# Posições iniciais
paddles_init_y = 310 - 62
paddle1_init_x = 0
paddle2_init_x = canvasWidth - PADDLE_WIDTH
ball_init_x = canvasWidth / 2 - BALL_SIZE / 2
ball_init_y = canvasHeight / 2 - BALL_SIZE / 2

# Funções para verificar colisões e gols
def is_goal_paddle1(ball_x):
    return ball_x + BALL_SIZE >= canvasWidth

def is_goal_paddle2(ball_x):
    return ball_x <= 0

def is_collision_paddle1(ball_x, ball_y, paddle_y):
    return (ball_x <= PADDLE_WIDTH and ball_y + BALL_SIZE >= paddle_y and ball_y <= paddle_y + PADDLE_HEIGHT)

def is_collision_paddle2(ball_x, ball_y, paddle_y):
    return (ball_x + BALL_SIZE >= canvasWidth - PADDLE_WIDTH and ball_y + BALL_SIZE >= paddle_y and ball_y <= paddle_y + PADDLE_HEIGHT)

# Classe para gerenciar o estado do jogo
class Room:
    def __init__(self, code, channel_layer):
        self.code = code
        self.players = []
        self.ball_position = [ball_init_x, ball_init_y]
        self.paddle_positions = [[paddle1_init_x, paddles_init_y], [paddle2_init_x, paddles_init_y]]
        self.ball_velocity = [2, 2]  # Velocidade inicial da bola
        self.current_directions = ['idle', 'idle']  # Direções das raquetes
        self.score = [0, 0]
        self.paddle_speed = 800  # Velocidade das raquetes
        self.end_game = False
        self.wall_collision = False
        self.channel_layer = channel_layer  # Usaremos o channel_layer para enviar atualizações
        self.game_loop_task = None
        self.logger = logging.getLogger(__name__)

    def add_player(self, player):
        if len(self.players) < 2:
            player_data = {
                'player': player,  # Salva a referência ao objeto PongConsumer
                'alive': True  # Cada jogador começa com o estado 'alive' como True
            }
            self.players.append(player_data)
            return True
        return False


    async def start_game_loop(self):
        """Inicia o loop de jogo assíncrono."""
        self.logger.info(f"Starting game loop for room {self.code}")
        self.end_game = False
        self.game_loop_task = asyncio.create_task(self.game_loop())

    async def game_loop(self):
        last_time = time.time()
        tick_rate = 240  # taxa de atualização em Hz
        update_interval = 1 / tick_rate  # tempo entre atualizações

        while not self.end_game:
            current_time = time.time()
            delta_time = current_time - last_time
            last_time = current_time

            # Atualiza o estado do jogo
            await self.update_game_state(delta_time)

            # Envia o estado do jogo para os jogadores
            await self.send_game_state_to_players()

            # Verifica se o jogo terminou
            await self.check_end_game()

            # Controla o tempo de espera para manter o tick rate
            await asyncio.sleep(update_interval)  # 1 segundo dividido pela taxa de atualização

    async def send_game_state_to_players(self):
        """Envia o estado atual do jogo para todos os jogadores."""
        response = {
            'action': 'update_game_state',
            'ball_position': self.ball_position,
            'paddle_positions': self.paddle_positions,
            'score': self.score,
        }
        self.logger.info(f'Sending game state: {response}')  # Adicione este log
        await self.channel_layer.group_send(
            self.code,
            {
                'type': 'game_state_update',
                'response': response
            }
        )


    async def game_state_update(self, event):
        """Trata o evento de atualização do estado do jogo."""
        self.logger.info(f'Received game state update: {event["response"]}')  # Adicione este log
        response = event['response']
        await self.send(text_data=json.dumps(response))



    async def update_game_state(self, delta_time):
        """Atualiza o estado do jogo, incluindo a posição da bola e das raquetes."""
        # Atualiza a posição da bola
        self.ball_position[0] += self.ball_velocity[0]
        self.ball_position[1] += self.ball_velocity[1]

        # Colisão com paredes
        if not self.wall_collision and (self.ball_position[1] <= 0 or self.ball_position[1] + BALL_SIZE >= canvasHeight):
            self.ball_velocity[1] *= -1
            self.wall_collision = True

        if self.ball_position[1] > BALL_SIZE + 1 and self.ball_position[1] < canvasHeight - BALL_SIZE - 1:
            self.wall_collision = False

        # Gols
        if is_goal_paddle1(self.ball_position[0]):
            self.score[0] += 1
            self.reset_ball()

        if is_goal_paddle2(self.ball_position[0]):
            self.score[1] += 1
            self.reset_ball()

        # Colisões com os paddles
        if self.ball_velocity[0] < 0 and is_collision_paddle1(self.ball_position[0], self.ball_position[1], self.paddle_positions[0][1]):
            self.ball_velocity[0] *= -1
        if self.ball_velocity[0] > 0 and is_collision_paddle2(self.ball_position[0], self.ball_position[1], self.paddle_positions[1][1]):
            self.ball_velocity[0] *= -1

        # Movimentos das raquetes
        for i in range(len(self.paddle_positions)):
            direction = self.current_directions[i]
            if direction == 'up':
                self.paddle_positions[i][1] = max(self.paddle_positions[i][1] - self.paddle_speed * delta_time, 0)
            elif direction == 'down':
                self.paddle_positions[i][1] = min(self.paddle_positions[i][1] + self.paddle_speed * delta_time, canvasHeight - PADDLE_HEIGHT)

    def reset_ball(self):
        self.ball_position = [ball_init_x, ball_init_y]
        self.ball_velocity[0] *= -1

    async def check_end_game(self):
        """Verifica se o jogo terminou."""
        if self.score[0] == FINAL_SCORE or self.score[1] == FINAL_SCORE:
            # Marcar o jogador perdedor como 'alive = False'
            if self.score[0] == FINAL_SCORE:
                winner = self.players[0]['player'].user.username
                self.players[1]['alive'] = False
            else:
                winner = self.players[1]['player'].user.username
                self.players[0]['alive'] = False

            # Verificar se há apenas um jogador vivo
            alive_players = [p for p in self.players if p['alive']]
            if len(alive_players) == 1:
                loser = alive_players[0]['player'].user.username if alive_players[0]['player'].user.username != winner else None
                await self.save_game_result(winner, loser)

            # Marcar o jogo como encerrado
            self.end_game = True

    async def save_game_result(self, winner, loser):
        """Salva o resultado do jogo."""
        match_data = {
            'winner': winner,
            'loser': loser,
            'winner_score': self.score[0],
            'loser_score': self.score[1],
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'game_type': 'pong'
        }
        for player in self.players:
            await player.save_match_history(match_data)
            await player.send(json.dumps({
                'action': 'game_over',
                'winner': winner,
                'loser': loser,
                'winner_score': self.score[0],
                'loser_score': self.score[1],
            }))

# Consumidor WebSocket utilizando Django Channels
class PongConsumer(AsyncWebsocketConsumer):
    rooms = {}

    async def connect(self):
        query_params = parse_qs(self.scope['query_string'].decode())
        room_code = self.scope['url_route']['kwargs'].get('room_code', None)
        self.token = query_params.get('token', [None])[0]
        self.is_player = False

        # Verificação de autenticação do jogador
        user = await is_authenticated(self.token)
        if not user:
            await self.close()
            return
        self.user = user

        # Obter a sala a partir do código
        room = await get_room(room_code)
        if not room:
            await self.close()
            return
        self.room = room

        # Inicializa a instância Room
        if room_code not in PongConsumer.rooms:
            PongConsumer.rooms[room_code] = Room(room_code, self.channel_layer)

        self.room_instance = PongConsumer.rooms[room_code]

        if not self.room_instance.add_player(self):
            await self.close()
            return

        await self.accept()

        # Adiciona o jogador ao grupo da sala
        await self.channel_layer.group_add(self.room_instance.code, self.channel_name)

       # Verifica se o jogador está na lista de jogadores
        player_index = -1
        if self in self.room_instance.players:
            player_index = self.room_instance.players.index(self)

        # Envia o estado inicial do jogo para o jogador
        await self.send(text_data=json.dumps({
            'action': 'assign_index',
            'player_index': player_index,  # Certifique-se de enviar um índice válido
            'ball_position': self.room_instance.ball_position,
            'paddle_positions': self.room_instance.paddle_positions
        }))

        # Se ambos os jogadores estão prontos, começa o jogo
        if len(self.room_instance.players) == 2:
            player_names = [player_data['player'].user.username for player_data in self.room_instance.players]


            for player_data in self.room_instance.players:
                await player_data['player'].send(json.dumps({
                    'action': 'start_game',
                    'player_names': player_names
                }))

    async def game_state_update(self, event):
        """
        Trata o evento de atualização do estado do jogo.
        """
        # Envia o estado do jogo de volta para o cliente
        response = event['response']
        await self.send(text_data=json.dumps(response))

    async def receive(self, text_data):
        data = json.loads(text_data)
        logger.info(f'Recebi atualização das teclas: {data}')
        if 'action' in data and data['action'] == 'move':
            player_index = data['player_index']
            direction = data['direction']
            self.room_instance.current_directions[player_index] = direction

    async def disconnect(self, close_code):
        # Remover o jogador do grupo da sala
        await self.channel_layer.group_discard(self.room_instance.code, self.channel_name)

        # Marcar o jogador desconectado como 'alive = False'
        for player_info in self.room_instance.players:
            if player_info['player'] == self:
                player_info['alive'] = False
                break

        # Verificar se resta apenas um jogador vivo
        alive_players = [p for p in self.room_instance.players if p['alive']]
        if len(alive_players) == 1:
            winner = alive_players[0]['player'].user.username
            loser = self.user.username  # O jogador que desconectou

            # Marcar o jogo como encerrado
            self.room_instance.end_game = True

            # Salvar o resultado do jogo e enviar a mensagem de vitória
            await self.room_instance.save_game_result(winner, loser)

            # Cancelar o loop do jogo
            if self.room_instance.game_loop_task:
                self.room_instance.game_loop_task.cancel()

        # Se não houver jogadores na sala, limpar a sala
        if len(alive_players) == 0:
            del PongConsumer.rooms[self.room_instance.code]

    async def save_match_history(self, match_data):
        # Simulando a chamada da API para salvar o histórico do jogo
        await database_sync_to_async(self._save_match_history)(match_data)

    def _save_match_history(self, match_data):
        url = 'http://userapi:8000/profile/update_match_history/'
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.token}',
        }
        response = requests.post(url, json=match_data, headers=headers)
        return response.json()
