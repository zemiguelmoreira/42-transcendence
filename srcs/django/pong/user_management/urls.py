from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name='index'),
    #path('check_username/', views.check_username, name='check_username'),
    #path('profile/', views.profile, name='check_username'),
    path('register/', views.register_user, name='register'),
    #path('users/', views.user_list, name='user-list'),
    path('get-csrf-token/', views.get_csrf_token, name='get_csrf_token'),
    #path('users/<int:pk>/', views.user_detail, name='user-detail'),
]





#https://localhost/api/users/profile/