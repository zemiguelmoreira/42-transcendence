# user_app/urls.py

from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from .views import CreateUserView, AddFriendView, RemoveFriendView, BlockUserView, \
                   UnblockUserView, UserProfileDetailView, ListAllUsersView, GetUserProfileView, \
                   UpdateBioView, CustomTokenObtainPairView, DeleteUserView, verify_2fa_code

urlpatterns = [
    path('user/register/', CreateUserView.as_view(), name='register'),
    path('token/', CustomTokenObtainPairView.as_view(), name="get_token"),
    path('token/verify-2fa/', verify_2fa_code, name='verify_2fa_code'),
    path('token/refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('auth/', include("rest_framework.urls")),
    path('profile/', UserProfileDetailView.as_view(), name='user_profile'),
    path('profile/add_friend/', AddFriendView.as_view(), name='add_friend'),
    path('profile/remove_friend/', RemoveFriendView.as_view(), name='remove_friend'),
    path('profile/block_user/', BlockUserView.as_view(), name='block_user'),
    path('profile/unblock_user/', UnblockUserView.as_view(), name='unblock_user'),
    path('profile/all_users/', ListAllUsersView.as_view(), name='list_all_users'),
    path('profile/get_user_profile/', GetUserProfileView.as_view(), name='get_user_profile'),
    path('profile/bio/', UpdateBioView.as_view(), name='profile-bio-update'),
    path('profile/delete-user/', DeleteUserView.as_view(), name='profile-bio-update'),
]
    # path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    # path('profile/', UserProfileView.as_view(), name='profile'),