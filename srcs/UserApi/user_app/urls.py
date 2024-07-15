# user_app/urls.py

from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('user/register/', views.CreateUserView.as_view(), name='register'),
    path('token/', views.CustomTokenObtainPairView.as_view(), name="get_token"),
    path('token/verify-2fa/', views.Verify2FACodeView.as_view(), name='verify_2fa_code'),
    path('token/refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('profile/', views.UserProfileDetailView.as_view(), name='user_profile'),
    path('profile/add_friend/', views.AddFriendView.as_view(), name='add_friend'),
    path('profile/remove_friend/', views.RemoveFriendView.as_view(), name='remove_friend'),
    path('profile/block_user/', views.BlockUserView.as_view(), name='block_user'),
    path('profile/unblock_user/', views.UnblockUserView.as_view(), name='unblock_user'),
    path('profile/all_users/', views.ListAllUsersView.as_view(), name='list_all_users'),
    path('profile/get_user_profile/',views.GetUserProfileView.as_view(), name='get_user_profile'),
    path('profile/update_profile/', views.UpdateUserProfileView.as_view(), name='profile_update'),
    path('profile/delete_user/', views.DeleteUserView.as_view(), name='profile_delete'),
    path('profile/get_qr_code/', views.GetQRCodeView.as_view(), name='get_qr_code'),
    path('profile/get_user_username/', views.GetUserUsernameView.as_view(), name='get_user_username'),
    path('profile/update_match_history/', views.UpdateMatchHistoryView.as_view(), name='update_match_history'),
    path('auth/', include("rest_framework.urls")),
]
    # path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    # path('profile/', UserProfileView.as_view(), name='profile'),
