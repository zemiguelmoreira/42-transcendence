# Create your views here.

import string
import random
from django.http import JsonResponse
from django.views import View
from GameServer.utils import is_authenticated
from asgiref.sync import async_to_sync
from .models import Room
import json
from django.contrib.auth import get_user_model

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

User = get_user_model()

def generate_unique_code():
    length = 8
    chars = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(random.choices(chars, k=length))
        if not Room.objects.filter(code=code).exists():
            return code

class CreateRoomView(View):
    def post(self, request, *args, **kwargs):
        # Extrair o token do cabeçalho
        token = request.headers.get('Authorization', None)
        if token and token.startswith('Bearer '):
            token = token[7:]  # Remove 'Bearer ' do início

        logger.info(token)

        # Verificar se o usuário está autenticado
        user = async_to_sync(is_authenticated)(token)
        logger.info(f'user: {user}')
        if not user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        data = json.loads(request.body)
        authorized_username = data.get('authorized_user')

        if not authorized_username:
            return JsonResponse({'error': 'Authorized user is required'}, status=400)

        if user.username == authorized_username:
            return JsonResponse({'error': 'You can not invite yourself'}, status=400)

        try:
            authorized_user = User.objects.get(username=authorized_username)
        except User.DoesNotExist:
            return JsonResponse({'error': 'Authorized user does not exist'}, status=400)

        code = generate_unique_code()
        room = Room.objects.create(code=code,  created_by=user.username, authorized_user=authorized_user.username)

        return JsonResponse({'code': room.code})