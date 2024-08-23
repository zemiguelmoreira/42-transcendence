
from django.urls import path
from . import views

urlpatterns = [
    path('create-room/', views.CreateRoomView.as_view(), name='create-room'),
    path('delete-room/', views.DeleteRoomView.as_view(), name='create-room'),
]
