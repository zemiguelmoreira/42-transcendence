from datetime import datetime, timedelta
from django.conf import settings
from django.http import HttpResponse
from rest_framework_simplejwt.tokens import AccessToken
from django.utils import timezone
from .models import UserCredentials
from rest_framework.response import Response
import json
import logging


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_token(user):
    token_lifetime = timedelta(days=1)  # Token expira em 1 dia
    token = AccessToken.for_user(user)
    token.set_exp(from_time=timezone.now() + token_lifetime)
    exp_time = timezone.now() + token_lifetime
    return str(token), exp_time 



def set_token_cookie(user, token):
    print("Setting cookie...")
    response = HttpResponse("Setting HttpOnly cookie")
    cookie_value = json.dumps({'token': token, 'user': user})
    response.set_cookie('session_cookie', cookie_value, secure=True)  # Ajustar 'secure' conforme necessário em https colocar true
    print("Cookie definido:", cookie_value) 
    return response


def verificar_token_cookie(request):
    session_cookie = request.COOKIES.get('session_cookie')
    logger.info(f'token na cookie: {session_cookie}')
    
    if session_cookie:
        try:
            # Decodifica o valor do cookie
            cookie_data = json.loads(session_cookie)
            token = cookie_data['token']
            user = cookie_data['user']

            # Verifica se o token é válido e não expirou
            user_credential = UserCredentials.objects.get(token=token, data_expiracao__gt=timezone.now())
            
            if user_credential.user.username == user:
                logger.info(f'token na cookie: success {user_credential.user}')
                return True
            else:
                logger.info('token na cookie: user mismatch')
                return False

        except (UserCredentials.DoesNotExist, json.JSONDecodeError, KeyError):
            logger.info('token na cookie: invalid or expired')
            return False
    else:
        logger.info('token na cookie: not found')
        return False
    

# Claro! Em Django, o objeto request.COOKIES é um dicionário que contém todos os cookies enviados pelo navegador do cliente. Aqui está um exemplo de como um objeto request.COOKIES pode parecer:

# python
# Copiar código
# {
#     'sessionid': '38d7319bc74d4d14b05936bba3fbd44c',
#     'csrftoken': '3ZPzU0B6y2iABY2gHZtp1so3DVG5DfGS',
#     'session_cookie': '{"token": "abc123", "user": "john_doe"}'
# }