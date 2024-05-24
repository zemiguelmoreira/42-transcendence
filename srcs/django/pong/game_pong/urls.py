from django.urls import path
from . import views

urlpatterns = [
    path('matches/', views.PongMatchListCreate.as_view(), name='pong-match-list-create'),
    path('get-csrf-token/', views.get_csrf_token, name='get_csrf_token'),
]
