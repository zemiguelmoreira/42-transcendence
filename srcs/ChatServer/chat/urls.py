from django.urls import path
from .views import online_users

urlpatterns = [
    path('online-users/', online_users, name='online_users'),
]
