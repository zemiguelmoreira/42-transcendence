# pong/consumers.py

import json
from channels.generic.websocket import WebsocketConsumer

class PongConsumer(WebsocketConsumer):
    players = []
    ball_position = [400, 300]
    paddle_positions = [[10, 250], [780, 250]]

    def connect(self):
        self.accept()
        self.players.append(self)
        player_index = len(self.players) - 1
        self.send(json.dumps({
            'action': 'assign_index',
            'player_index': player_index,
            'ball_position': self.ball_position,
            'paddle_positions': self.paddle_positions
        }))

    def disconnect(self, close_code):
        if self in self.players:
            self.players.remove(self)

    def receive(self, text_data):
        data = json.loads(text_data)
        if 'action' in data and data['action'] == 'join':
            return

        if 'paddle_positions' in data:
            self.paddle_positions = data['paddle_positions']
        
        # Lógica do jogo: atualizar posições de bola e raquetes
        # Aqui você pode adicionar a lógica para movimentar a bola
        # Exemplo de atualização da posição da bola
        self.ball_position[0] += 1
        self.ball_position[1] += 1

        response = {
            'ball_position': self.ball_position,
            'paddle_positions': self.paddle_positions
        }
        
        # Enviar atualização para todos os jogadores conectados
        for player in self.players:
            player.send(text_data=json.dumps(response))
