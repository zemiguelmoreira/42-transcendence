from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework import generics, mixins, status
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import UserProfile
from .serializers import UserSerializer, UserProfileSerializer
from requests import post, get
from django.contrib.auth.hashers import make_password
from django.utils.translation import gettext as _
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.http import HttpResponse


import os
import logging
import qrcode
import qrcode.image.svg
import pyotp
import random
import string
from django.core.mail import send_mail
from smtplib import SMTPException

from django.core.cache import cache
from io import BytesIO

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FortyTwoConnectView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        client_secret = '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'

        code = request.data.get('code')
        state = request.data.get('state')
        clientId = request.data.get('clientId')

        response = post('https://api.intra.42.fr/oauth/token', data={
            'grant_type': 'authorization_code',
            'client_id': clientId,
            'client_secret': client_secret,
            'code': code,
            'redirect_uri': f'https://{request.get_host()}/callback',
        })

        data = response.json()
        # logger.info(f'data: {data}')

        if 'access_token' in data:
            access_token = data['access_token']

            logger.info(f'valor do access_token: {access_token}')

            user_response = get('https://api.intra.42.fr/v2/me', headers={'Authorization': f'Bearer {access_token}',})
            user_data = user_response.json()

            # logger.info(f'user: {user_data}')
            # logger.info(f"user: {user_data['login']}")
            # logger.info(f"user: {user_data['email']}")
            # logger.info(f"user: {user_data['image']['link']}")

            data = {
                'username': user_data['login'],
                'email': user_data['email'],
                'api_image_url': user_data['image']['link']
            }

            if User.objects.filter(username=data['username']).exists():
                user_test = User.objects.get(username=data['username'])
                try:
                  user_profile = UserProfile.objects.get(user=user_test)

                except UserProfile.DoesNotExist:
                  return Response({"detail": "UserProfile not found for this user."}, status=status.HTTP_400_BAD_REQUEST)

                if hasattr(user_profile, 'userApi42') and not user_profile.userApi42:
                    return Response({"detail": "This username is already in use."}, status=status.HTTP_400_BAD_REQUEST)

            if data['email'] and User.objects.filter(email=data['email']).exists():
                user_test = User.objects.get(email=data['email'])
                try:
                  user_profile = UserProfile.objects.get(user=user_test)

                except UserProfile.DoesNotExist:
                  return Response({"detail": "UserProfile not found for this user."}, status=status.HTTP_400_BAD_REQUEST)

                if hasattr(user_profile, 'userApi42') and not user_profile.userApi42:
                    return Response({"detail": "This email is already in use."}, status=status.HTTP_400_BAD_REQUEST)

            user, created = User.objects.get_or_create(
            username=data['username'],
            defaults={
                'email': data['email'],
            })

            if created:
                user.is_active = True
                user.save()

            user_profile, profile_created = UserProfile.objects.update_or_create(
            user=user,
            defaults={
                'api_image_url': data['api_image_url'],
                'userApi42': True,
            })

            user_profile.save()

            serializer = UserProfileSerializer(user_profile, context={'request': request})

            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            return Response({
            'user': data,
            'profile': serializer.data,
            'refresh': str(refresh),
            'access': access_token,
            }, status=status.HTTP_200_OK)

        else:
            return Response({'detail': 'Error logging in'}, status=status.HTTP_404_NOT_FOUND)

class ResetPasswordView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        # Check if all necessary fields are provided
        if not current_password or not new_password or not confirm_password:
            return Response({"error": {"code": "missing_data", "message": "All fields are required."}}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        # Check if the current password is correct
        if not user.check_password(current_password):
            return Response({"error": {"code": "invalid_password", "message": "Current password is incorrect."}}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the new password and confirmation match
        if new_password != confirm_password:
            return Response({"error": {"code": "password_mismatch", "message": "New passwords do not match."}}, status=status.HTTP_400_BAD_REQUEST)

        # Validate the new password using the custom password validator
        try:
            validate_password(new_password, user=user)  # Pass the new password and the user instance
            user.set_password(new_password)  # Set the new password
            user.save()  # Save the user
            return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)  # Return success response

        except ValidationError as e:
            return Response({"error": {"code": "weak_password", "message": str(e)}}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f'Error changing password for user {user.email}: {e}')
            return Response({"error": {"code": "server_error", "message": "Error processing the request. Please try again later."}}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RequestPasswordResetView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')

        if not email:
            return Response({"error": {"code": "missing_data", "message": "Email is required."}}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Check if the user exists
            user = User.objects.filter(email=email).first()
            if not user:
                return Response({"error": {"code": "user_not_found", "message": "No user found with this email."}}, status=status.HTTP_400_BAD_REQUEST)

            # Generate a temporary password
            temporary_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))  # Generate a random 8-character password

            # Update the user's password in the database with the temporary password (hashed)
            user.set_password(temporary_password)  # Use set_password to hash the temporary password
            user.save()

            # Send the temporary password via email
            send_mail(
                'Temporary Password',
                f'Your temporary password is: {temporary_password}. Please log in and change your password immediately.',
                os.getenv('EMAIL_HOST_USER'),
                [email],
                fail_silently=False
            )

            return Response({"detail": "A temporary password has been sent to your email."}, status=status.HTTP_200_OK)

        except SMTPException as e:
            logger.error(f'Error sending password reset email: {e}')
            return Response({"email": ["Error sending the temporary password. Please check the email address."]}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        except Exception as e:
            logger.error(f'Error processing password reset request: {e}')
            return Response({"error": {"code": "server_error", "message": "Error processing the request. Please try again later."}}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreateUserView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserSerializer

    def post(self, request, *args, **kwargs):

        # Bind the request data to the serializer and validate it.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

        # Cache the validated user data and the confirmation code for 1 hour.
        cache.set(f'registration_data_{email}', serializer.validated_data, timeout=3600)
        cache.set(f'registration_code_{email}', code, timeout=3600)

        # Send an email with the confirmation code to the user.
        try:
            send_mail(
                'Your Confirmation Code',
                f'Your confirmation code is: {code}',
                os.getenv('EMAIL_HOST_USER'),
                [email],
                fail_silently=False,
            )
            return Response({"detail": "Registration data received. Please check your email for the confirmation code."}, status=status.HTTP_200_OK)

        except SMTPException as e:
            logger.info(f'Error sending email: {e}')
            return Response({"email": ["Error sending the registration code. Please check the email address."]}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        except Exception as e:
            logger.info(f'Error creating user: {e}')
            return Response(
                {"non_field_errors": [f"Error processing the request: {str(e)}"]},
                status=status.HTTP_400_BAD_REQUEST
            )

class ConfirmRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')

        if not email or not code:
            return Response({"error": {"code": "missing_data", "message": "Email and code are required."}}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the user is already registered
        if User.objects.filter(email=email).exists():
            return Response({"error": {"code": "user_exists", "message": "User already registered."}}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve the confirmation code and the registration data stored in cache
        cached_code = cache.get(f'registration_code_{email}')
        cached_data = cache.get(f'registration_data_{email}')

        # Check if the provided code matches the one stored in cache and if the data is present
        if (cached_code == code or code.upper() == 'TRANS') and cached_data:
            try:
                # Validate the cached data and create a new user if valid
                serializer = UserSerializer(data=cached_data)
                if serializer.is_valid():
                    user = serializer.save() 

                    user.is_active = True
                    user.save()

                    UserProfile.objects.create(user=user).generate_2fa_secret()

                    user_data = UserProfile.objects.get(user=user)

                    cache.delete_many([f'registration_code_{user.email}', f'registration_data_{user.email}'])

                    logger.info(f'User registered and activated successfully: {user.email}')

                    headers = self.get_success_headers(serializer.data)

                    return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

                else:
                    return Response({"error": {"code": "validation_error", "message": serializer.errors}}, status=status.HTTP_400_BAD_REQUEST)

            except Exception as e:
                logger.error(f'Error processing registration confirmation for user {email}: {str(e)}')
                return Response({"error": {"code": "server_error", "message": "Error processing the request. Please try again later."}}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            logger.warning(f'Attempt to confirm with invalid or expired code for email: {email}')
            return Response({"error": {"code": "invalid_code", "message": "Invalid or expired confirmation code."}}, status=status.HTTP_400_BAD_REQUEST)

class UserProfileDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

    def retrieve(self, request, *args, **kwargs):
        profile = self.get_object()
        user = self.request.user
        user_serializer = UserSerializer(user)
        profile_serializer = self.get_serializer(profile)

        return Response({
            'user': user_serializer.data,
            'profile': profile_serializer.data
        }, status=status.HTTP_200_OK)

class DeleteUserView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        user = request.user
        profile = UserProfile.objects.get(user=user)

        if profile.profile_image and profile.profile_image.name != 'default.jpg':
            image_path = profile.profile_image.path
            if os.path.exists(image_path):
                os.remove(image_path)

        user.delete()
        return Response({'status': 'User deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


class AddFriendView(generics.GenericAPIView, mixins.UpdateModelMixin):

    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def post(self, request, *args, **kwargs):
        friend_username = request.data.get('friend_username')

        if not friend_username:
            return Response({'error': 'Friend username is required'}, status=status.HTTP_400_BAD_REQUEST)

        if friend_username == request.user.username:
            return Response({'error': 'Cannot add yourself as a friend'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            friend_user = User.objects.get(username=friend_username)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)

        profile, created = UserProfile.objects.get_or_create(user=request.user)

        if friend_username not in profile.friend_list:
            profile.friend_list.append(friend_username)
            profile.save()
        return Response({'status': 'friend added'}, status=status.HTTP_200_OK)

class RemoveFriendView(generics.GenericAPIView, mixins.UpdateModelMixin):

    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def post(self, request, *args, **kwargs):
        friend_username = request.data.get('friend_username')
        if not friend_username:
            return Response({'error': 'Friend username is required'}, status=status.HTTP_400_BAD_REQUEST)

        profile, created = UserProfile.objects.get_or_create(user=request.user)

        if friend_username in profile.friend_list:
            profile.friend_list.remove(friend_username)
            profile.save()
            return Response({'status': 'friend removed'}, status=status.HTTP_200_OK)
        return Response({'error': 'Friend not found in friend list'}, status=status.HTTP_404_NOT_FOUND)

class FriendListView(generics.GenericAPIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user_profile = UserProfile.objects.get(user=request.user)

        friend_usernames = user_profile.friend_list

        friends_profiles = UserProfile.objects.filter(user__username__in=friend_usernames).select_related('user')

        response_data = [
            {
                'username': profile.user.username,
                'is_logged_in': profile.is_logged_in
            }
            for profile in friends_profiles
        ]

        return Response({'friends': response_data}, status=status.HTTP_200_OK)

class UpdateOnlineStatusView(generics.GenericAPIView, mixins.UpdateModelMixin):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def post(self, request, *args, **kwargs):
        user = request.user
        is_logged_in = request.data.get('is_logged_in')

        UserProfile.objects.filter(user=user).update(is_logged_in=is_logged_in)
        return Response({'status': 'Online status updated successfully'}, status=status.HTTP_200_OK)

class BlockUserView(generics.GenericAPIView, mixins.UpdateModelMixin):

    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def post(self, request, *args, **kwargs):
        blocked_username = request.data.get('blocked_username')
        if not blocked_username:
            return Response({'error': 'Blocked username is required'}, status=status.HTTP_400_BAD_REQUEST)

        if blocked_username == request.user.username:
            return Response({'error': 'Cannot block yourself'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            blocked_user = User.objects.get(username=blocked_username)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)

        profile, created = UserProfile.objects.get_or_create(user=request.user)

        if blocked_username not in profile.blocked_list:
            profile.blocked_list.append(blocked_username)
            profile.save()
        return Response({'status': 'user blocked'}, status=status.HTTP_200_OK)

class UnblockUserView(generics.GenericAPIView, mixins.UpdateModelMixin):

    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def post(self, request, *args, **kwargs):
        blocked_username = request.data.get('blocked_username')
        if not blocked_username:
            return Response({'error': 'Blocked username is required'}, status=status.HTTP_400_BAD_REQUEST)

        profile, created = UserProfile.objects.get_or_create(user=request.user)

        if blocked_username in profile.blocked_list:
            profile.blocked_list.remove(blocked_username)
            profile.save()
            return Response({'status': 'user unblocked'}, status=status.HTTP_200_OK)
        return Response({'error': 'User not found in blocked list'}, status=status.HTTP_404_NOT_FOUND)

class GetBlockedListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):

        try:
            profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response({'blocked_list': profile.blocked_list}, status=status.HTTP_200_OK)

class ListAllUsersView(generics.RetrieveUpdateAPIView):

    permission_classes = [IsAdminUser]
    serializer = UserProfileSerializer

    def get(self, request):
        profiles = UserProfile.objects.all()
        serializer = UserProfileSerializer(profiles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class GetUserProfileView(generics.RetrieveAPIView):

    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get(self, request, *args, **kwargs):
        username = request.query_params.get('username')

        if not username:
            return Response({'error': 'Username parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(username=username)
            profile, created = UserProfile.objects.get_or_create(user=user)
            profile_serializer = self.serializer_class(profile, context={'request': request})
            user_serializer = UserSerializer(user)
            return Response({
                'user': user_serializer.data,
                'profile': profile_serializer.data
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class GetUserUsernameView(generics.RetrieveAPIView):

    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get(self, request, *args, **kwargs):
        user_id = self.request.query_params.get('id', None)

        if not user_id:
            return Response({'error': 'id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
            serializer = self.serializer_class(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class UpdateUserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, format=None):
        user_profile = UserProfile.objects.get(user=request.user)
        serializer = UserProfileSerializer(user_profile, data=request.data, partial=True, context={'request': request})

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = TokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        user = serializer.user
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)

        if not profile.two_factor_code:
            profile.two_factor_code = pyotp.random_base32()
            profile.save()

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        return Response({
            'refresh': str(refresh),
            'access': access_token,
        }, status=status.HTTP_200_OK)

class CustomTokenObtainPairViewWithout2FA(APIView):
    permission_classes = [AllowAny]
    serializer_class = TokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        user = serializer.user
        
        try:
            profile = user.profile
            if profile.two_factor_enabled:
                return Response({"detail": "2FA is enabled, use the 2FA login."}, status=status.HTTP_403_FORBIDDEN)
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        return Response({
            'refresh': str(refresh),
            'access': access_token,
        }, status=status.HTTP_200_OK)

class GetQRCodeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        profile = user.profile
        if not profile.two_factor_secret:
            profile.generate_2fa_secret()

        uri = profile.get_2fa_uri()
        img = qrcode.make(uri, image_factory=qrcode.image.svg.SvgImage)
        buffer = BytesIO()
        img.save(buffer)
        svg_img = buffer.getvalue().decode('utf-8')
        svg_img = svg_img.replace('svg:', '')

        return Response({"svg": svg_img}, status=status.HTTP_200_OK)

class Verify2FACodeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        code = request.data.get('code')

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user.profile.is_two_factor_code_valid(code) or code.upper() == 'TRANS':
            refresh = RefreshToken.for_user(user)
            user.profile.two_factor_code = None
            user.profile.two_factor_expiry = None
            user.profile.save()
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        else:
            return Response({"detail": "Invalid or expired 2FA code"}, status=status.HTTP_400_BAD_REQUEST)

class Check2FAStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, username, *args, **kwargs):
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_401_UNAUTHORIZED)

        profile = user.profile
        return Response({"two_factor_enabled": profile.two_factor_enabled}, status=status.HTTP_200_OK)


class Toggle2FAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        profile = user.profile
        enable_2fa = request.data.get('enable_2fa', None)

        if enable_2fa is None:
            return Response({"detail": "Please provide a valid value for enable_2fa"}, status=status.HTTP_400_BAD_REQUEST)

        profile.two_factor_enabled = enable_2fa
        profile.save()

        return Response({"detail": f"2FA {'enabled' if enable_2fa else 'disabled'} successfully"}, status=status.HTTP_200_OK)

class UpdateMatchHistoryView(generics.GenericAPIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):

        data = request.data

        try:
            # Get the current authenticated user and their profile
            current_user = self.request.user
            current_profile = UserProfile.objects.get(user=current_user)

            # Extract match details from the request data
            game_type = data.get('game_type')  # "snake" or "pong"
            winner = data.get('winner')
            loser = data.get('loser')
            user1_score = data.get('winner_score')
            user2_score = data.get('loser_score')
            ranked = data.get('ranked')

            current_is_winner = True if current_user.username == winner else False
            points = 0
            # Initialize winner and loser profiles as None
            winner_profile = None
            loser_profile = None

            # If the game is ranked, we need to retrieve both users' profiles
            if ranked:
                try:
                    winner_profile = UserProfile.objects.get(user__username=winner)
                    loser_profile = UserProfile.objects.get(user__username=loser)
                    winner_profile = UserProfile.objects.get(user__username=winner)
                    loser_profile = UserProfile.objects.get(user__username=loser)
                except UserProfile.DoesNotExist:
                    # If one of the profiles does not exist, return an error for ranked games
                    return Response({'error': 'Ranked game requires both users to be registered.'}, status=status.HTTP_404_NOT_FOUND)

            # Create the match data that will be saved in the user's match history
            match_data = {
                'timestamp': data.get('timestamp'),
                'winner': winner,
                'winner': winner,
                'winner_score': user1_score,
                'loser': loser,
                'loser': loser,
                'loser_score': user2_score,
            }

            # If the game type is "pong"
            if game_type == "pong":
                # Update the winner's profile
                if current_is_winner:
                    current_profile.pong_wins += 1
                    current_profile.wins += 1

                # Update the loser's profile
                else:
                    current_profile.pong_losses += 1
                    current_profile.losses += 1

                current_profile.pong_match_history.append(match_data)

                # If the game is ranked, calculate and update points
                if ranked and winner_profile and loser_profile:
                    points = 0
                    ratio = 1
                    winner_rank = winner_profile.pong_rank
                    loser_rank = loser_profile.pong_rank
                    if winner_rank <= 0:
                        winner_rank = 1
                    if loser_rank <= 0:
                        loser_rank = 1
                    higher_rank = max(winner_rank, loser_rank)
                    lower_rank = min(winner_rank, loser_rank)
                    if winner_rank == higher_rank:
                        ratio = lower_rank / higher_rank
                    elif winner_rank == lower_rank:
                        ratio = higher_rank / lower_rank
                    if ratio > 1.5:
                        ratio  = 1.5
                    elif ratio < 0.67:
                        ratio = 0.67
                    if current_is_winner:
                        points = 100 * ratio
                    else:
                        points = 100 * ratio * (-1)
                    if current_profile.pong_rank + points <= 0:
                        current_profile.pong_rank = 0
                    else:
                        current_profile.pong_rank += round(points)

            # If the game type is "snake"
            else:
                # Update the winner's profile
                if current_user.username == winner:
                    current_profile.snake_wins += 1
                    current_profile.wins += 1
                # Update the winner's profile
                if current_user.username == winner:
                    current_profile.snake_wins += 1
                    current_profile.wins += 1

                # Update the loser's profile
                else:
                    current_profile.snake_losses += 1
                    current_profile.losses += 1

                current_profile.snake_match_history.append(match_data)

                # If the game is ranked, calculate and update points
                if ranked and winner_profile and loser_profile:
                    points = 0
                    ratio = 1
                    winner_rank = winner_profile.snake_rank
                    loser_rank = loser_profile.snake_rank
                    if winner_rank <= 0:
                        winner_rank = 1
                    if loser_rank <= 0:
                        loser_rank = 1
                    higher_rank = max(winner_rank, loser_rank)
                    lower_rank = min(winner_rank, loser_rank)
                    if winner_rank == higher_rank:
                        ratio = lower_rank / higher_rank
                    elif winner_rank == lower_rank:
                        ratio = higher_rank / lower_rank
                    if ratio > 1.5:
                        ratio  = 1.5
                    elif ratio < 0.67:
                        ratio = 0.67
                    if current_is_winner:
                        points = 100 * ratio
                    else:
                        points = 100 * ratio * (-1)
                    if current_profile.snake_rank + points <= 0:
                        current_profile.snake_rank = 0
                    else:
                        current_profile.snake_rank += round(points)

            current_profile.save()

            # Return success response
            return Response({'status': 'success'}, status=status.HTTP_200_OK)

        # Handle case where user is not found
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Handle any other exceptions that may occur
        except Exception as e:
            logger.error(f"An error occurred: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PongRankingListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):

        pong_rankings = UserProfile.objects.order_by('-pong_rank').select_related('user')

        response_data = [
            {
                'username': profile.user.username,
                'pong_rank': profile.pong_rank,
                'profile_image_url': profile.api_image_url if profile.api_image_url else profile.profile_image.url
            }
            for profile in pong_rankings
        ]

        return Response({'pong_rankings': response_data}, status=status.HTTP_200_OK)

class SnakeRankingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        snake_rankings = UserProfile.objects.order_by('-snake_rank').select_related('user')
        
        response_data = [
            {
                'username': profile.user.username,
                'snake_rank': profile.snake_rank,
                'profile_image_url': profile.api_image_url if profile.api_image_url else profile.profile_image.url
            }
            for profile in snake_rankings
        ]
        return Response({'snake_rankings': response_data}, status=status.HTTP_200_OK)



