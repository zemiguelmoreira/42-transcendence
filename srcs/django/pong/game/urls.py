# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('single/local/', views.singleLocal, name='single-local'),
    path('get-csrf-token/', views.get_csrf_token, name='get_csrf_token'),
]