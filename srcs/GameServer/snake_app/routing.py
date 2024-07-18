
from django.urls import re_path
from .consumers import SnakeConsumer

snake_websocket_urlpatterns = [
    re_path(r'ws/snake/(?P<room_name>\w+)/$', SnakeConsumer.as_asgi()),
]
