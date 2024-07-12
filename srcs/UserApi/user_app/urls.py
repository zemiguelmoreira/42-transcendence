# user_app/urls.py

from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from . import views


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
    path('profile/bio/', views.UpdateBioView.as_view(), name='profile-bio-update'),
    path('profile/delete-user/', views.DeleteUserView.as_view(), name='profile-bio-update'),
    path('profile/get_qr_code/', views.GetQRCodeView.as_view(), name='get_qr_code'),
    path('profile/get_user_username/', views.GetUserUsernameView.as_view(), name='get_user_username'),
    path('auth/', include("rest_framework.urls")),
]
    # path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    # path('profile/', UserProfileView.as_view(), name='profile'),
    