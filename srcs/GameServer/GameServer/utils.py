from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from room_gen_app.models import Room
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

User = get_user_model()

async def is_authenticated(token):
    if not token:
        return None  # Retorne None ou levante uma exceção se o token não estiver presente

    try:
        access_token = AccessToken(token)
        user_id = access_token.get('user_id')  # Use .get() para evitar KeyError se a chave não estiver presente
        if not user_id:
            return None  # Retorne None se user_id não estiver presente no payload
        user = await get_user(user_id)
        return user
    except (InvalidToken, TokenError) as e:
        # Opcional: Logar a exceção para depuração
        return None

async def get_user(user_id):
    try:
        user = await database_sync_to_async(User.objects.get)(pk=user_id)
        return user
    except User.DoesNotExist:
        return None


async def get_room(code):
    try:
        room = await database_sync_to_async(Room.objects.get)(code=code)
        return room
    except Room.DoesNotExist:
        return None
    

def get_related_users(room):
    return room.created_by, room.authorized_user


async def get_related_users_async(room):
    return await database_sync_to_async(get_related_users)(room)

async def check_user_access(room, user):
    created_by, authorized_user = await get_related_users_async(room)
    logger.info(f'User: {user} - {created_by} - {authorized_user}')
    return created_by == user or authorized_user == user