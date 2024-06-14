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
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.views.decorators.csrf import csrf_protect
from rest_framework.permissions import AllowAny

urlpatterns = [
    path('profile/create/', views.register_user, name='register_user'),
	path('profile/login/', csrf_protect(views.LoginView.as_view()), name='login_user'),
    path('user-profile/<int:user_id>/', views.user_profile_api_view, name='user_profile_api'),
    path('get-user-id/', views.get_user_id, name='get_user_id'),
    path('change-profile/', views.change_profile, name='get_user_id'),
    path('delete-account/<int:user_id>/', views.delete_account, name='delete-account'),

    path('get-csrf-token/', views.get_csrf_token, name='get_csrf_token'),
	path('api/token/',views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', views.CustomTokenRefreshView.as_view(), name='token_refresh'),

	path('home/', views.Home.as_view(), name='teste_view'),
    path('protected/', views.ProtectedView.as_view(), name='protected_view'),
]



views.LoginView.permission_classes = [AllowAny]