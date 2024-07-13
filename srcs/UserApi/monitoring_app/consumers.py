import json
import django
django.setup()
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from user_app.models import UserProfile
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import UntypedToken, AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser

User = get_user_model()

class UserStatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        token = self.scope['query_string'].decode().split('=')[1]
        logger.info(f'token: {token}')
        user = await self.get_user_from_token(token)
        if user and user.is_authenticated:
            self.scope['user'] = user
            await self.accept()
            await self.update_user_status(user, True)
        else:
            await self.close()

    async def disconnect(self, close_code):
        user = self.scope.get('user', None)
        if user and user.is_authenticated:
            await self.update_user_status(user, False)

    async def receive(self, text_data):
        # Process received messages if necessary
        data = json.loads(text_data)
        await self.send(text_data=json.dumps({'message': 'Received'}))

    @database_sync_to_async
    def update_user_status(self, user, is_logged_in):
        UserProfile.objects.filter(user=user).update(is_logged_in=is_logged_in)

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            print(f"User ID from token: {user_id}")  # Log user ID
            user = User.objects.get(id=user_id)
            return user
        except (InvalidToken, User.DoesNotExist) as e:
            print(f"Token validation error: {str(e)}")  # Log the error
            return AnonymousUser()

