import jwt
from datetime import datetime, timedelta
from django.conf import settings
from rest_framework_simplejwt.tokens import AccessToken
from django.utils import timezone
from .models import Token
from rest_framework.response import Response
import logging


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# def generate_token(user):
#     payload = {
#         'user_id': user.user_id,
#         'exp': datetime.now(timezone.utc) + timedelta(days=1),  # Token expira em 1 dia
#         'iat': datetime.now(timezone.utc)
#     }
#     token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
#     return token



# Com o python-jose para o jwt

# from datetime import datetime, timedelta, timezone
# import jwt 
# from django.conf import settings

# def generate_token(user):
#     payload = {
#         'user_id': user.id,
#         'exp': datetime.now(timezone.utc) + timedelta(days=1),  # Token expira em 1 dia
#         'iat': datetime.now(timezone.utc)
#     }
#     token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
#     return token


def generate_token(user):
    token_lifetime = timedelta(days=1)  # Token expira em 1 dia
    token = AccessToken.for_user(user)
    token.set_exp(from_time=timezone.now() + token_lifetime)
    return str(token)


def verificar_token_cookie(request):
    token_key = request.COOKIES.get('session_cookie')
    logger.info(f'token na cookie: {token_key}')
    
    if token_key:
        try:
            # Verifique se existe um token válido com a chave fornecida
            token = Token.objects.get(token=token_key, data_expiracao__gt=timezone.now())
            user = token.user
            
            # Se o token e o usuário associado existirem e o token não tiver expirado, retorne sucesso
            # return Response({'status': 'success', 'message': 'Token válido', 'user': user.username})
            logger.info(f'token na cookie: success { user }')
            return True
        
        except Token.DoesNotExist:
            # Se o token não for encontrado ou expirou, retorne erro
            # return Response({'status': 'error', 'message': 'Token inválido ou expirado'})
            logger.info(f'token na cookie: invalid expired')
            return False
    else:
        # Se a cookie de sessão não for encontrada, retorne erro
        # return Response({'status': 'error', 'message': 'Cookie de sessão não encontrado'})
        logger.info(f'token na cookie: not found')
        return False