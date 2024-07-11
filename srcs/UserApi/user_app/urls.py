# user_app/urls.py

from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from .views import CreateUserView, AddFriendView, RemoveFriendView, BlockUserView, \
                   UnblockUserView, UserProfileDetailView, ListAllUsersView, GetUserProfileView, \
                   UpdateBioView, GetUserUsernameView, UserProfileDeleteView

urlpatterns = [
    path('user/register/', CreateUserView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name="get_token"),
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
    path('profile/get_user_username/', GetUserUsernameView.as_view(), name='get_user_username'),
    path('profile/delete_account/', UserProfileDeleteView.as_view(), name='delete_user'),
]
    # path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    # path('profile/', UserProfileView.as_view(), name='profile'),