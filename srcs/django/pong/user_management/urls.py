# from django.urls import path
# from . import views

# urlpatterns = [
#     path('profile/', views.profile, name='profile'),
#     path('profile/create/', views.register_user, name='register_user'),
#     path('get-csrf-token/', views.get_csrf_token, name='get_csrf_token'),
# ]

# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.UserProfileListCreate.as_view(), name='profile'),
    path('profile/create/', views.register_user, name='register_user'),
	path('profile/login/', views.LoginView.as_view(), name='login_user'),
    path('get-csrf-token/', views.get_csrf_token, name='get_csrf_token'),
]
