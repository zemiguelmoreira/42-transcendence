
from django.urls import re_path
from .consumers import PongConsumer

pong_websocket_urlpatterns = [
    re_path(r'ws/pong/(?P<room_code>\w+)/$', PongConsumer.as_asgi()),
]
