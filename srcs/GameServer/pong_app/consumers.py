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

# Initial paddle and ball positions
paddles_init_y = 310 - 62
paddle1_init_x = 0
paddle2_init_x = canvasWidth - PADDLE_WIDTH

ball_init_x = canvasWidth / 2 - BALL_SIZE / 2
ball_init_y = canvasHeight / 2 - BALL_SIZE / 2

# Function to check if the ball has scored for player 1
def is_goal_paddle1(ball_x):
    """
    Check if player 1 has scored a goal.

    Args:
        ball_x (float): The x-coordinate of the ball.

    Returns:
        bool: True if the ball has crossed the goal line for player 1, False otherwise.
    """
    return ball_x + BALL_SIZE >= canvasWidth

# Function to check if the ball has scored for player 2
def is_goal_paddle2(ball_x):
    """
    Check if player 2 has scored a goal.

    Args:
        ball_x (float): The x-coordinate of the ball.

    Returns:
        bool: True if the ball has crossed the goal line for player 2, False otherwise.
    """
    return ball_x <= 0

# Function to check collision between ball and player 1's paddle
def is_collision_paddle1(ball_x, ball_y, paddle_y):
    """
    Check for collision between the ball and player 1's paddle.

    Args:
        ball_x (float): The x-coordinate of the ball.
        ball_y (float): The y-coordinate of the ball.
        paddle_y (float): The y-coordinate of player 1's paddle.

    Returns:
        bool: True if the ball collides with player 1's paddle, False otherwise.
    """
    return (ball_x <= PADDLE_WIDTH and ball_y + BALL_SIZE >= paddle_y and ball_y <= paddle_y + PADDLE_HEIGHT)

# Function to check collision between ball and player 2's paddle
def is_collision_paddle2(ball_x, ball_y, paddle_y):
    """
    Check for collision between the ball and player 2's paddle.

    Args:
        ball_x (float): The x-coordinate of the ball.
        ball_y (float): The y-coordinate of the ball.
        paddle_y (float): The y-coordinate of player 2's paddle.

    Returns:
        bool: True if the ball collides with player 2's paddle, False otherwise.
    """
    return (ball_x + BALL_SIZE >= canvasWidth - PADDLE_WIDTH and ball_y + BALL_SIZE >= paddle_y and ball_y <= paddle_y + PADDLE_HEIGHT)

class PongConsumer(AsyncWebsocketConsumer):
    # Class-level dictionary to hold room data
    rooms = {}

    async def connect(self):
        """
        Handle a new WebSocket connection. Authenticates the user and joins the game room.
        """
        query_params = parse_qs(self.scope['query_string'].decode())
        room_code = self.scope['url_route']['kwargs'].get('room_code', None)
        self.token = query_params.get('token', [None])[0]
        self.is_player = False

        # Authenticate user based on the provided token
        user = await is_authenticated(self.token)
        if not user:
            await self.close()
            return

        self.user = user

        # Retrieve the game room
        room = await get_room(room_code)
        if not room:
            await self.close()
            return

        self.room = room
        is_auth = await check_user_access(self.room, self.user)
        logger.info(f'is auth: {is_auth}')
        if not is_auth:
            logger.info(f'User {user.username} does not have access to {self.room.code}')
            await self.close()
            return

        await self.accept()  # Accept the WebSocket connection
        logger.info(f'User {user.username} connected to room {self.room.code}')

        # Initialize the room data if it doesn't exist
        if self.room.code not in PongConsumer.rooms:
            PongConsumer.rooms[self.room.code] = {
                'players': [],
                'ball_position': [ball_init_x, ball_init_y],
                'paddle_positions': [[paddle1_init_x, paddles_init_y], [paddle2_init_x, paddles_init_y]],
                'ball_velocity': [500, 500],
                'current_directions': ['idle', 'idle'],
                'score': [0, 0],
                'paddle_speed': 800,
                'end_game': False,
                'disconnect': "",
            }

        room = PongConsumer.rooms[self.room.code]

        # Prevent multiple connections by the same player
        for player in room['players']:
            if player.user.id == self.user.id:
                await self.close()
                return

        # Add the player to the room if there's space
        if len(room['players']) < 2 and self not in room['players']:
            self.is_player = True
            room['players'].append(self)
            player_index = room['players'].index(self)

            # Send the initial game state to the new player
            await self.send(json.dumps({
                'action': 'assign_index',
                'player_index': player_index,
                'ball_position': room['ball_position'],
                'paddle_positions': room['paddle_positions'],
                'score': room['score']
            }))

        # If two players are connected, start the game
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
        """
        Handle WebSocket disconnection. Updates the game state if a player disconnects.

        Args:
            close_code (int): The code indicating the reason for disconnection.
        """
        logger.info('Disconnect Called\n')
        
        try:
            room = PongConsumer.rooms[self.room.code]
            
            # Signal the end of the game due to disconnection
            room['end_game'] = True
            room['disconnect'] = self.user.username
            logger.info(f"Room {self.room.code}: Game ended by disconnection from {self.user.username}")
            
        except KeyError:
            logger.error(f"Room {self.room.code} not found in PongConsumer.rooms")
            return

    async def receive(self, text_data):
        """
        Handle incoming messages from players. Processes player movement commands.

        Args:
            text_data (str): The JSON string containing player actions.
        """
        data = json.loads(text_data)

        # Handle player movement
        if self.is_player and 'action' in data:
            if data['action'] == 'move':
                player_index = data['player_index']
                direction = data['direction']
                PongConsumer.rooms[self.room.code]['current_directions'][player_index] = direction

    async def game_loop(self, room):
        """
        The main game loop that continuously updates the game state.

        Args:
            room (dict): The game room data containing players and game state.
        """
        last_time = time.time()

        # Main game loop to update the game state
        while room['players']:
            current_time = time.time()
            delta_time = current_time - last_time
            last_time = current_time
            
            await self.update_game_state(room, delta_time)
            await asyncio.sleep(0.008)  # Increase update frequency for smoother ball movement

    async def update_game_state(self, room, delta_time):
        """
        Update the positions of the ball and paddles, check for collisions and goals.

        Args:
            room (dict): The game room data containing players and game state.
            delta_time (float): The time elapsed since the last update.
        """
        # Update ball position
        room['ball_position'][0] += room['ball_velocity'][0] * delta_time
        room['ball_position'][1] += room['ball_velocity'][1] * delta_time

        # Bounce the ball off the top and bottom walls
        if room['ball_position'][1] <= 0 or room['ball_position'][1] + BALL_SIZE >= canvasHeight:
            room['ball_velocity'][1] *= -1

        # Check for goals and update score
        if is_goal_paddle1(room['ball_position'][0]):
            room['score'][0] += 1
            room['ball_position'] = [ball_init_x, ball_init_y]
            room['ball_velocity'][0] *= -1
            logger.info("Goal by paddle 1")
        if is_goal_paddle2(room['ball_position'][0]):
            room['score'][1] += 1
            room['ball_position'] = [ball_init_x, ball_init_y]
            room['ball_velocity'][0] *= -1
            logger.info("Goal by paddle 2")

        # Update paddle positions based on current directions
        for index, player in enumerate(room['players']):
            paddle_y = room['paddle_positions'][index][1]
            direction = room['current_directions'][index]
            if direction == 'up':
                paddle_y -= room['paddle_speed'] * delta_time
            elif direction == 'down':
                paddle_y += room['paddle_speed'] * delta_time
            
            # Keep paddles within bounds
            if paddle_y < 0:
                paddle_y = 0
            elif paddle_y > canvasHeight - PADDLE_HEIGHT:
                paddle_y = canvasHeight - PADDLE_HEIGHT

            room['paddle_positions'][index][1] = paddle_y

        # Check for collisions between ball and paddles
        if is_collision_paddle1(room['ball_position'][0], room['ball_position'][1], room['paddle_positions'][0][1]):
            room['ball_velocity'][0] *= -1
            logger.info("Collision with paddle 1")
        if is_collision_paddle2(room['ball_position'][0], room['ball_position'][1], room['paddle_positions'][1][1]):
            room['ball_velocity'][0] *= -1
            logger.info("Collision with paddle 2")

        # Send updated game state to all players
        for player in room['players']:
            await player.send(json.dumps({
                'action': 'update_game_state',
                'ball_position': room['ball_position'],
                'paddle_positions': room['paddle_positions'],
                'score': room['score'],
            }))
        
        # Check if the game has ended
        if room['end_game']:
            logger.info('Game has ended due to disconnection')
            winner = None
            loser = None
            
            # Determine winner and loser based on disconnection
            if room['disconnect'] == room['players'][0].user.username:
                winner = room['players'][1].user.username
                loser = room['players'][0].user.username
            else:
                winner = room['players'][0].user.username
                loser = room['players'][1].user.username

            logger.info(f"Game result due to disconnection: Winner: {winner}, Loser: {loser}")

            # Notify both players and end the game
            for player in room['players']:
                await player.end_game(room, winner, loser)
            
        # Check if the game has ended by reaching the final score
        elif room['score'][0] == FINAL_SCORE or room['score'][1] == FINAL_SCORE:
            logger.info(f"Game finished by reaching final score: {room['score'][0]} - {room['score'][1]}")

            if room['score'][0] == FINAL_SCORE:
                winner = room['players'][0].user.username
                loser = room['players'][1].user.username
            else:
                loser = room['players'][0].user.username
                winner = room['players'][1].user.username

            logger.info(f"Game result by score: Winner: {winner}, Loser: {loser}")

            # Notify both players and end the game
            for player in room['players']:
                await player.end_game(room, winner, loser)

            # Remove the player from the room and end the match
            room['players'].remove(self)
            logger.info('Player removed from room')

        # If no players remain, cancel the game loop
        if len(room['players']) == 0:
            room['game_loop_task'].cancel()
            room['game_loop_task'] = None
            del PongConsumer.rooms[self.room.code]

    
    async def end_game(self, room, winner, loser):
        """
        Handle the end of the game, saving match history and notifying players.

        Args:
            room (dict): The game room data containing players and game state.
            winner (str): The username of the winning player.
            loser (str): The username of the losing player.
        """
        logger.info('Function end_game called')
        
        winner_score = room['score'][0] if room['players'][0].user.username == winner else room['score'][1]
        loser_score = room['score'][0] if room['players'][0].user.username == loser else room['score'][1]

        timestamp = int(time.time())
        formatted_time = datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()

        result = {
            'action': 'game_over',
            'winner': winner,
            'loser': loser,
            'winner_score': winner_score,
            'loser_score': loser_score,
            'timestamp': formatted_time,  # Adding timestamp
            'game_type': 'pong'
        }

        to_save = {
            'winner': winner,
            'loser': loser,
            'winner_score': winner_score,
            'loser_score': loser_score,
            'timestamp': formatted_time,  # Adding timestamp
            'game_type': 'pong',
            'ranked': True
        }

        # Save the match history to the database
        await self.save_match_history(to_save)

        # Send results to all players
        for player in room['players']:
            await player.send(json.dumps(result))

        # Clear the room state
        await self.close()
        del PongConsumer.rooms[self.room.code]

    async def save_match_history(self, match_data):
        """
        Save the match history to the database.

        Args:
            match_data (dict): The match data to be saved, including winner, loser, scores, and timestamp.
        """
        url = 'http://userapi:8000/profile/update_match_history/'
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.token}',
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=match_data, headers=headers)
                response.raise_for_status()  # Raise exceptions for error status codes
                logger.info(f"Match history saved successfully: {response.json()}")
        except httpx.HTTPStatusError as http_err:
            logger.error(f"HTTP error occurred: {http_err}")
        except Exception as err:
            logger.error(f"Other error occurred: {err}")
