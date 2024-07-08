import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
import time

class PongConsumer(AsyncWebsocketConsumer):
    players = []
    ball_position = [400, 300]
    paddle_positions = [[10, 250], [780, 250]]
    ball_velocity = [300, 300]  # Velocidade em pixels por segundo
    paddle_speed = 200  # Velocidade do paddle em pixels por segundo
    current_directions = [None, None]  # Lista para armazenar a direção de cada jogador

    async def connect(self):
        await self.accept()
        self.players.append(self)
        player_index = len(self.players) - 1
        await self.send(json.dumps({
            'action': 'assign_index',
            'player_index': player_index,
            'ball_position': self.ball_position,
            'paddle_positions': self.paddle_positions
        }))

        if not hasattr(PongConsumer, 'game_loop_task'):
            PongConsumer.game_loop_task = asyncio.create_task(self.game_loop())

    async def disconnect(self, close_code):
        if self in self.players:
            self.players.remove(self)
        if not self.players and hasattr(PongConsumer, 'game_loop_task') and PongConsumer.game_loop_task:
            PongConsumer.game_loop_task.cancel()
            PongConsumer.game_loop_task = None

    async def receive(self, text_data):
        data = json.loads(text_data)
        if 'action' in data and data['action'] == 'join':
            return

        if 'action' in data and data['action'] == 'move':
            player_index = data['player_index']
            direction = data['direction']
            self.current_directions[player_index] = direction  # Atualiza a direção do jogador

    async def game_loop(self):
        last_time = time.time()
        while self.players:
            current_time = time.time()
            delta_time = current_time - last_time
            last_time = current_time
            
            self.update_game_state(delta_time)
            await asyncio.sleep(0.03)

    def update_game_state(self, delta_time):
        # Atualiza a posição da bola com base no delta time
        self.ball_position[0] += self.ball_velocity[0] * delta_time
        self.ball_position[1] += self.ball_velocity[1] * delta_time

        # Verifica se a bola atingiu os limites do canvas e ajusta a velocidade conforme necessário
        if self.ball_position[1] <= 0 or self.ball_position[1] >= 600:
            self.ball_velocity[1] *= -1
        if self.ball_position[0] <= 0 or self.ball_position[0] >= 800:
            self.ball_velocity[0] *= -1
        
        # Movimentação dos paddles baseada na direção atual de cada jogador
        for i in range(len(self.paddle_positions)):
            direction = self.current_directions[i]
            if direction == 'up':
                self.paddle_positions[i][1] = max(self.paddle_positions[i][1] - self.paddle_speed * delta_time, 0)  # Movimento para cima
            elif direction == 'down':
                self.paddle_positions[i][1] = min(self.paddle_positions[i][1] + self.paddle_speed * delta_time, 600 - 100)  # Movimento para baixo

        # Prepara a resposta para enviar aos clientes
        response = {
            'ball_position': self.ball_position,
            'paddle_positions': self.paddle_positions
        }

        # Envia a atualização para todos os jogadores conectados
        for player in self.players:
            asyncio.create_task(player.send(json.dumps(response)))
