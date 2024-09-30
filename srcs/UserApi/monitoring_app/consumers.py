import json
import django
django.setup()  # Initialize Django environment
import logging

# Set up logging for the application
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from channels.generic.websocket import AsyncWebsocketConsumer
from user_app.models import UserProfile
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser

User = get_user_model()  # Get the User model

class UserStatusConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for tracking user login status.
    
    This consumer connects to a WebSocket, authenticates the user based on a JWT token,
    and updates the user's online status in the database.
    """

    async def connect(self):
        """
        Handles the connection to the WebSocket.
        
        1. Extracts the token from the query string.
        2. Retrieves the user associated with the token.
        3. Accepts the WebSocket connection if the user is authenticated.
        4. Updates the user's online status to 'True'.
        """
        token = self.scope['query_string'].decode().split('=')[1]  # Decode the token from the query string
        logger.info(f'token: {token}')  # Log the token for debugging
        user = await self.get_user_from_token(token)  # Get the user from the token
        
        if user and user.is_authenticated:  # Check if the user is authenticated
            self.scope['user'] = user  # Store the user in the scope
            await self.accept()  # Accept the WebSocket connection
            await self.update_user_status(user, True)  # Update user's online status to True
        else:
            await self.close()  # Close the connection if not authenticated

    async def disconnect(self, close_code):
        """
        Handles disconnection from the WebSocket.
        
        Updates the user's online status to 'False' when the connection is closed.
        """
        user = self.scope.get('user', None)  # Retrieve the user from the scope
        if user and user.is_authenticated:  # Check if the user is authenticated
            await self.update_user_status(user, False)  # Update user's online status to False

    async def receive(self, text_data):
        """
        Handles incoming messages from the WebSocket.
        
        Receives a message, processes it, and sends a confirmation back to the client.
        """
        data = json.loads(text_data)  # Parse the incoming JSON data
        await self.send(text_data=json.dumps({'message': 'Received'}))  # Send a confirmation message

    @database_sync_to_async
    def update_user_status(self, user, is_logged_in):
        """
        Updates the user's online status in the database.
        
        Args:
            user: The user whose status is to be updated.
            is_logged_in: Boolean indicating if the user is logged in or not.
        """
        UserProfile.objects.filter(user=user).update(is_logged_in=is_logged_in)

    @database_sync_to_async
    def get_user_from_token(self, token):
        """
        Retrieves the user associated with the given JWT token.
        
        Args:
            token: The JWT token used for authentication.
        
        Returns:
            User: The authenticated user, or AnonymousUser if authentication fails.
        """
        try:
            access_token = AccessToken(token)  # Validate the token
            user_id = access_token['user_id']  # Extract user ID from the token
            logger.info(f"User ID from token: {user_id}")  # Log the user ID
            user = User.objects.get(id=user_id)  # Get the user by ID
            return user  # Return the user
        except (InvalidToken, User.DoesNotExist) as e:
            logger.error(f"Token validation error: {str(e)}")  # Log any errors
            return AnonymousUser()  # Return an AnonymousUser if token is invalid or user does not exist

