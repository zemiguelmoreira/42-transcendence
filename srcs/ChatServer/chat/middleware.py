import jwt
from channels.auth import AuthMiddleware
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async

User = get_user_model()

class JWTAuthMiddleware(AuthMiddleware):
    async def __call__(self, scope, receive, send):
        token = self.get_token_from_scope(scope)
        user = await self.get_user_from_token(token)

        # Set the user in the scope
        scope['user'] = user
        return await super().__call__(scope, receive, send)

    def get_token_from_scope(self, scope):
        # Token extraction logic (e.g., from query string or headers)
        query_string = scope.get('query_string', b'').decode('utf-8')
        return query_string.split('=')[-1] if '=' in query_string else None

    async def get_user_from_token(self, token):
        if not token:
            return AnonymousUser()
        try:
            decoded_token = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            user_id = decoded_token.get('user_id')
            return await sync_to_async(User.objects.get)(id=user_id)
        except jwt.ExpiredSignatureError:
            return AnonymousUser()
        except jwt.InvalidTokenError:
            return AnonymousUser()
        except User.DoesNotExist:
            return AnonymousUser()

