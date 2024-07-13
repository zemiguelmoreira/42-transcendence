# myproject/asgi.py

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from pong_app.routing import websocket_urlpatterns
# from snake_app.routing import websocket_urlpatterns_snake

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'GameServer.settings')

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns,
            # websocket_urlpatterns_snake,
        )
    ),
})
