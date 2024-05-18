from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.profile, name='profile'),
    path('profile/create/', views.register_user, name='register_user'),
    path('get-csrf-token/', views.get_csrf_token, name='get_csrf_token'),
]
