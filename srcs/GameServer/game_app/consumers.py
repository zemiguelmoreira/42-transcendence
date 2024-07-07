# pong/consumers.py

import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer

class PongConsumer(AsyncWebsocketConsumer):
    players = []
    ball_position = [400, 300]
    paddle_positions = [[10, 250], [780, 250]]
    ball_velocity = [2, 2]

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
        if not self.players and hasattr(PongConsumer, 'game_loop_task'):
            PongConsumer.game_loop_task.cancel()
            PongConsumer.game_loop_task = None

    async def receive(self, text_data):
        data = json.loads(text_data)
        if 'action' in data and data['action'] == 'join':
            return

        if 'paddle_positions' in data:
            self.paddle_positions = data['paddle_positions']

    async def game_loop(self):
        while self.players:
            self.update_game_state()
            await asyncio.sleep(0.033)  # Aproximadamente 30 FPS

    def update_game_state(self):
        self.ball_position[0] += self.ball_velocity[0]
        self.ball_position[1] += self.ball_velocity[1]

        if self.ball_position[1] <= 0 or self.ball_position[1] >= 600:
            self.ball_velocity[1] *= -1
        if self.ball_position[0] <= 0 or self.ball_position[0] >= 800:
            self.ball_velocity[0] *= -1

        response = {
            'ball_position': self.ball_position,
            'paddle_positions': self.paddle_positions
        }

        for player in self.players:
            asyncio.create_task(player.send(json.dumps(response)))
