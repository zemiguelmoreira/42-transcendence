from django.utils import timezone
from datetime import timedelta
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

### Confirm Registration View

class ConfirmRegistrationView(APIView):
    permission_classes = [AllowAny]  # Allows access to anyone, even unauthenticated users.

    def post(self, request):
        logger.info(f'request: {request}')  # Log the incoming request data for debugging purposes.
        email = request.data.get('email')  # Extract the email from the request data.
        code = request.data.get('code')  # Extract the confirmation code from the request data.

        if not email or not code:
            # Return an error if either the email or code is missing.
            return Response({"detail": "Email and code are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve the cached confirmation code associated with the email.
        cached_code = cache.get(f'registration_code_{email}')

        if cached_code and cached_code == code:
            try:
                user = User.objects.get(email=email)  # Fetch the user by email.
                user.is_active = True  # Activate the user account.
                user.save()  # Save the user instance with the updated active status.
                # Clear the cached confirmation code after successful activation.
                cache.delete(f'registration_code_{email}')  
                return Response({"detail": "Registration confirmed successfully"}, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                # Handle the case where no user is found for the given email.
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Return an error if the confirmation code is invalid or expired.
            return Response({"detail": "Invalid or expired confirmation code"}, status=status.HTTP_400_BAD_REQUEST)

### Views for User Creation and Update

class CreateUserView(generics.GenericAPIView):
    permission_classes = [AllowAny]  # Allow any user to access this view.
    serializer_class = UserSerializer  # Specify the serializer for user data validation.

    def post(self, request, *args, **kwargs):
        """
        POST method for user registration.
        
        Receives user data, validates it, generates a confirmation code, stores data in the cache, 
        and sends an email with the confirmation code.
        
        @param request: The HTTP request containing user data (email, username, password, etc.)
        @param args: Additional positional arguments.
        @param kwargs: Additional keyword arguments.
        @return: A Response indicating whether the registration data was successfully received.
        """
        # Bind the request data to the serializer and validate it.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)  # Raise an exception if validation fails.

        email = serializer.validated_data['email']  # Extract the validated email.
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))  # Generate a random 6-character confirmation code.

        # Cache the validated user data and the confirmation code for 1 hour.
        cache.set(f'registration_data_{email}', serializer.validated_data, timeout=3600)
        cache.set(f'registration_code_{email}', code, timeout=3600)

        # Send an email with the confirmation code to the user.
        send_mail(
            'Your Confirmation Code',  # Email subject.
            f'Your confirmation code is: {code}',  # Email body containing the confirmation code.
            os.getenv('EMAIL_HOST_USER'),  # Sender's email address.
            [email],  # Recipient's email address.
            fail_silently=False,  # Raise an error if the email fails to send.
        )

        # Return a success response indicating the code was sent to the user's email.
        return Response({"detail": "Registration data received. Please check your email for the confirmation code."}, status=status.HTTP_200_OK)

### Confirm Registration (Continued)

class ConfirmRegistrationView(APIView):
    permission_classes = [AllowAny]  # Allow any user to access this view.

    def post(self, request):
        email = request.data.get('email')  # Get the email from the request data.
        code = request.data.get('code')  # Get the confirmation code from the request data.

        if not email or not code:
            # Return an error if either the email or code is missing.
            return Response({"detail": "Email and code are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve the cached confirmation code and user registration data.
        cached_code = cache.get(f'registration_code_{email}')
        cached_data = cache.get(f'registration_data_{email}')

        if cached_code == code and cached_data:
            # Validate the cached data and create a new user if valid.
            serializer = UserSerializer(data=cached_data)
            if serializer.is_valid():
                user = serializer.save()  # Save the new user instance.
                user.is_active = True  # Activate the user account.
                user.save()  # Save the user instance with updated status.
                # Create a user profile and generate a 2FA secret.
                UserProfile.objects.create(user=user).generate_2fa_secret()
                
                # Clear the cached data and code.
                cache.delete(f'registration_code_{email}')
                cache.delete(f'registration_data_{email}')

                return Response({"detail": "Registration confirmed and user activated successfully."}, status=status.HTTP_200_OK)
            else:
                # Return validation errors if any.
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Return an error if the confirmation code is invalid or expired.
            return Response({"detail": "Invalid or expired confirmation code"}, status=status.HTTP_400_BAD_REQUEST)

### User Profile Detail View

class UserProfileDetailView(generics.RetrieveUpdateAPIView):
    """
    View to allow authenticated users to view and update their profile. 
    If the profile does not exist, it will be created.
    """
    serializer_class = UserProfileSerializer  # Specify the serializer for profile data validation.
    permission_classes = [IsAuthenticated]  # Restrict access to authenticated users.

    def get_object(self):
        # Ensure the profile exists for the authenticated user, creating it if necessary.
        logger.info(f'Request userprofile detail: {self.request.user}')
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

    def retrieve(self, request, *args, **kwargs):
        profile = self.get_object()  # Retrieve or create the user's profile.
        user = self.request.user  # Get the authenticated user.
        user_serializer = UserSerializer(user)  # Serialize the user data.
        profile_serializer = self.get_serializer(profile)  # Serialize the profile data.

        return Response({
            'user': user_serializer.data,  # Include the serialized user data in the response.
            'profile': profile_serializer.data  # Include the serialized profile data in the response.
        }, status=status.HTTP_200_OK)

### Delete User View

class DeleteUserView(generics.DestroyAPIView):
    """
    View to allow authenticated users to delete their own account.
    """
    permission_classes = [IsAuthenticated]  # Restrict access to authenticated users.

    def delete(self, request, *args, **kwargs):
        user = request.user  # Get the authenticated user.
        profile = UserProfile.objects.get(user=user)  # Get the user's profile.

        # Delete the profile image if it is not the default image.
        if profile.profile_image and profile.profile_image.name != 'default.jpg':
            image_path = profile.profile_image.path  # Get the image path.
            if os.path.exists(image_path):  # Check if the image file exists.
                os.remove(image_path)  # Delete the image file.

        user.delete()  # Delete the user account.
        return Response({'status': 'User deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

### Views for Managing Friendships

class AddFriendView(generics.GenericAPIView, mixins.UpdateModelMixin):
    """
    View to allow authenticated users to add a friend to their friend list.
    """
    permission_classes = [IsAuthenticated]  # Restrict access to authenticated users.
    serializer_class = UserProfileSerializer  # Specify the serializer for profile data validation.

    def post(self, request, *args, **kwargs):
        friend_username = request.data.get('friend_username')  # Get the friend's username from the request data.

        if not friend_username:
            # Return an error if the friend's username is missing.
            return Response({'error': 'Friend username is required'}, status=status.HTTP_400_BAD_REQUEST)

        if friend_username == request.user.username:
            # Prevent users from adding themselves as friends.
            return Response({'error': 'You cannot add yourself as a friend'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            friend_user = User.objects.get(username=friend_username)  # Get the friend user instance by username.
        except User.DoesNotExist:
            # Return an error if the friend user does not exist.
            return Response({'error': 'Friend not found'}, status=status.HTTP_404_NOT_FOUND)

        profile = UserProfile.objects.get(user=request.user)  # Get the authenticated user's profile.

        if friend_user in profile.friends.all():
            # Return a message if the user is already a friend.
            return Response({'message': 'User is already in your friend list'}, status=status.HTTP_200_OK)

        # Add the friend user to the authenticated user's friend list.
        profile.friends.add(friend_user)
        return Response({'status': 'Friend added successfully'}, status=status.HTTP_200_OK)

class RemoveFriendView(generics.GenericAPIView, mixins.UpdateModelMixin):
    """
    View to allow authenticated users to remove a friend from their friend list.
    """
    permission_classes = [IsAuthenticated]  # Restrict access to authenticated users.
    serializer_class = UserProfileSerializer  # Specify the serializer for profile data validation.

    def post(self, request, *args, **kwargs):
        friend_username = request.data.get('friend_username')  # Get the friend's username from the request data.

        if not friend_username:
            # Return an error if the friend's username is missing.
            return Response({'error': 'Friend username is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            friend_user = User.objects.get(username=friend_username)  # Get the friend user instance by username.
        except User.DoesNotExist:
            # Return an error if the friend user does not exist.
            return Response({'error': 'Friend not found'}, status=status.HTTP_404_NOT_FOUND)

        profile = UserProfile.objects.get(user=request.user)  # Get the authenticated user's profile.

        if friend_user not in profile.friends.all():
            # Return a message if the user is not a friend.
            return Response({'message': 'User is not in your friend list'}, status=status.HTTP_200_OK)

        # Remove the friend user from the authenticated user's friend list.
        profile.friends.remove(friend_user)
        return Response({'status': 'Friend removed successfully'}, status=status.HTTP_200_OK)

class FriendListView(generics.GenericAPIView):
    """
    View to retrieve the authenticated user's friend list with usernames and login status.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users.

    def get(self, request, *args, **kwargs):
        """
        Retrieves the authenticated user's friend list and returns their usernames and login status.

        @param request: The HTTP GET request.
        @return: A JSON response containing the list of friends and their login status.
        """
        user_profile = UserProfile.objects.get(user=request.user)  # Gets the profile of the authenticated user.

        # List of friend usernames
        friend_usernames = user_profile.friend_list

        # Retrieves friend profiles by filtering on the usernames
        friends_profiles = UserProfile.objects.filter(user__username__in=friend_usernames).select_related('user')

        # Constructs the response with usernames and login status
        response_data = [
            {
                'username': profile.user.username,
                'is_logged_in': profile.is_logged_in
            }
            for profile in friends_profiles
        ]

        return Response({'friends': response_data}, status=status.HTTP_200_OK)

### Views de Gestão de Bloqueios

class BlockUserView(generics.GenericAPIView, mixins.UpdateModelMixin):
    """
    View for the authenticated user to block another user.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users.
    serializer_class = UserProfileSerializer  # Defines the serializer for the view.

    def post(self, request, *args, **kwargs):
        """
        Blocks the user specified in the 'blocked_username' parameter.

        @param request: The HTTP POST request containing the username of the user to block.
        @return: A JSON response indicating the status of the operation.
        """
        blocked_username = request.data.get('blocked_username')  # Gets the username of the user to block.
        if not blocked_username:
            return Response({'error': 'Blocked username is required'}, status=status.HTTP_400_BAD_REQUEST)

        if blocked_username == request.user.username:
            return Response({'error': 'Cannot block yourself'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            blocked_user = User.objects.get(username=blocked_username)  # Checks if the user exists.
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)

        profile, created = UserProfile.objects.get_or_create(user=request.user)

        if blocked_username not in profile.blocked_list:
            profile.blocked_list.append(blocked_username)
            profile.save()
        return Response({'status': 'user blocked'}, status=status.HTTP_200_OK)


class UnblockUserView(generics.GenericAPIView, mixins.UpdateModelMixin):
    """
    View for the authenticated user to unblock another user.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users.
    serializer_class = UserProfileSerializer  # Defines the serializer for the view.

    def post(self, request, *args, **kwargs):
        """
        Unblocks the user specified in the 'blocked_username' parameter.

        @param request: The HTTP POST request containing the username of the user to unblock.
        @return: A JSON response indicating the status of the operation.
        """
        blocked_username = request.data.get('blocked_username')  # Gets the username of the user to unblock.
        if not blocked_username:
            return Response({'error': 'Blocked username is required'}, status=status.HTTP_400_BAD_REQUEST)

        profile, created = UserProfile.objects.get_or_create(user=request.user)

        if blocked_username in profile.blocked_list:
            profile.blocked_list.remove(blocked_username)
            profile.save()
            return Response({'status': 'user unblocked'}, status=status.HTTP_200_OK)
        return Response({'error': 'User not found in blocked list'}, status=status.HTTP_404_NOT_FOUND)


class GetBlockedListView(APIView):
    """
    View for the authenticated user to get their list of blocked users.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users.

    def get(self, request, *args, **kwargs):
        """
        Retrieves the authenticated user's blocked user list.

        @param request: The HTTP GET request.
        @return: A JSON response containing the list of blocked users.
        """
        try:
            profile = UserProfile.objects.get(user=request.user)  # Gets the profile of the authenticated user.
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response({'blocked_list': profile.blocked_list}, status=status.HTTP_200_OK)


class ListAllUsersView(generics.RetrieveUpdateAPIView):
    """
    View to list all user profiles. Available only to administrators.
    """
    permission_classes = [IsAdminUser]  # Restricts access to admin users.
    serializer = UserProfileSerializer  # Defines the serializer for the view.

    def get(self, request):
        """
        Retrieves all user profiles.

        @param request: The HTTP GET request.
        @return: A JSON response containing all user profiles.
        """
        profiles = UserProfile.objects.all()  # Retrieves all user profiles.
        serializer = UserProfileSerializer(profiles, many=True)  # Serializes the profiles.
        return Response(serializer.data, status=status.HTTP_200_OK)


class GetUserProfileView(generics.RetrieveAPIView):
    """
    View to get a specific user's profile based on the username. Available to authenticated users.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users.
    serializer_class = UserProfileSerializer  # Defines the serializer for the view.

    def get(self, request, *args, **kwargs):
        """
        Retrieves the profile of the user specified by the 'username' query parameter.

        @param request: The HTTP GET request containing the username parameter.
        @return: A JSON response containing the user and profile data.
        """
        username = request.query_params.get('username')  # Gets the username from query parameters.

        if not username:
            return Response({'error': 'Username parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(username=username)  # Retrieves the user.
            profile, created = UserProfile.objects.get_or_create(user=user)  # Retrieves or creates the user profile.
            profile_serializer = self.serializer_class(profile, context={'request': request})  # Serializes the profile.
            user_serializer = UserSerializer(user)  # Serializes the user.
            return Response({
                'user': user_serializer.data,
                'profile': profile_serializer.data
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class GetUserUsernameView(generics.RetrieveAPIView):
    """
    View to get the username of a specific user based on their ID. Available to authenticated users.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users.
    serializer_class = UserSerializer  # Defines the serializer for the view.

    def get(self, request, *args, **kwargs):
        """
        Retrieves the username of the user specified by the 'id' query parameter.

        @param request: The HTTP GET request containing the id parameter.
        @return: A JSON response containing the user's username.
        """
        user_id = self.request.query_params.get('id', None)  # Gets the user ID from query parameters.

        if not user_id:
            return Response({'error': 'id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)  # Retrieves the user by ID.
            serializer = self.serializer_class(user)  # Serializes the user.
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UpdateUserProfileView(APIView):
    """
    View to update the profile of the authenticated user.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users.

    def put(self, request, format=None):
        """
        Updates the profile of the authenticated user with the data provided.

        @param request: The HTTP PUT request containing the profile data to update.
        @return: A JSON response indicating the status of the update operation.
        """
        user_profile = UserProfile.objects.get(user=request.user)  # Gets the profile of the authenticated user.
        serializer = UserProfileSerializer(user_profile, data=request.data, partial=True, context={'request': request})

        logger.info(f'UpdateUserProfileView request data: {request.data}')  # Logs the request data.

        if serializer.is_valid():
            serializer.save()  # Saves the updated profile data.
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom view to obtain JWT tokens with additional 2FA setup.
    """
    serializer_class = TokenObtainPairSerializer  # Defines the serializer for the view.

    def post(self, request, *args, **kwargs):
        """
        Obtains JWT tokens and generates a 2FA secret if needed.

        @param request: The HTTP POST request containing user credentials.
        @return: A JSON response containing the refresh and access tokens.
        """
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        user = serializer.user
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)  # Creates the profile if it does not exist.

        # Generates a TOTP secret if it doesn't already exist
        if not profile.two_factor_code:
            profile.two_factor_code = pyotp.random_base32()
            profile.save()

        # Generates JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        return Response({
            'refresh': str(refresh),
            'access': access_token,
        }, status=status.HTTP_200_OK)


class GetQRCodeView(APIView):
    """
    View to get the QR code for 2FA setup for the authenticated user.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users.

    def get(self, request, *args, **kwargs):
        """
        Retrieves the QR code for 2FA setup.

        @param request: The HTTP GET request.
        @return: A JSON response containing the SVG representation of the QR code.
        """
        user = request.user
        profile = user.profile
        if not profile.two_factor_secret:
            profile.generate_2fa_secret()  # Generates a 2FA secret if it doesn't exist.

        uri = profile.get_2fa_uri()  # Gets the 2FA URI for the QR code.
        img = qrcode.make(uri, image_factory=qrcode.image.svg.SvgImage)  # Creates the QR code image.
        buffer = BytesIO()
        img.save(buffer)
        svg_img = buffer.getvalue().decode('utf-8')
        svg_img = svg_img.replace('svg:', '')  # Removes the 'svg:' prefix.

        return Response({"svg": svg_img}, status=status.HTTP_200_OK)


class Verify2FACodeView(APIView):
    """
    View to verify the 2FA code provided by the user.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users.

    def post(self, request, *args, **kwargs):
        """
        Verifies the 2FA code and returns JWT tokens if valid.

        @param request: The HTTP POST request containing the username and 2FA code.
        @return: A JSON response containing the refresh and access tokens if the code is valid.
        """
        username = request.data.get('username')
        code = request.data.get('code')

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user.profile.is_two_factor_code_valid(code):
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


class UpdateMatchHistoryView(generics.GenericAPIView):
    """
    View to update the match history of the authenticated user.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users.

    def post(self, request, *args, **kwargs):
        """
        Updates the match history based on the provided match data.

        @param request: The HTTP POST request containing match data.
        @return: A JSON response indicating the status of the operation.
        """
        data = request.data
        logger.info(f'request data :  {data}')  # Logs the request data.
        try:
            current_user = self.request.user
            current_profile = UserProfile.objects.get(user=current_user)

            game_type = data.get('game_type')  # "snake" or "pong"
            user1 = data.get('winner')
            user2 = data.get('loser')
            user1_score = data.get('winner_score')
            user2_score = data.get('loser_score')

            match_data = {
                'timestamp': data.get('timestamp'),
                'winner': user1,
                'winner_score': user1_score,
                'loser': user2,
                'loser_score': user2_score,
            }

            if game_type == "pong":
                current_profile.pong_match_history.append(match_data)

                if current_user.username == user1:
                    current_profile.pong_wins += 1
                    current_profile.wins += 1
                else:
                    current_profile.pong_losses += 1
                    current_profile.losses += 1

                if current_profile.pong_wins % 2 == 0:
                    current_profile.pong_rank += 1
            else:
                current_profile.snake_match_history.append(match_data)

                if current_user.username == user1:
                    current_profile.snake_wins += 1
                    current_profile.wins += 1
                else:
                    current_profile.snake_losses += 1
                    current_profile.losses += 1

                if current_profile.snake_wins % 2 == 0:
                    current_profile.snake_rank += 1

            current_profile.save()

            return Response({'status': 'success'}, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)



class PongRankingListView(APIView):
    """
    View to get the list of users based on Pong ranking.
    Returns the username and pong_rank value.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users.

    def get(self, request, *args, **kwargs):
        """
        Retrieves all user profiles sorted by Pong rank.

        @param request: The HTTP GET request.
        @return: A JSON response containing the list of users and their Pong ranks.
        """
        pong_rankings = UserProfile.objects.order_by('-pong_rank').select_related('user')  # Retrieves and sorts profiles.

        response_data = [
            {
                'username': profile.user.username,  # Accesses the username directly from the relationship.
                'pong_rank': profile.pong_rank,
                'profile_image_url': profile.profile_image.url if profile.profile_image else None  # Accesses the profile image URL directly.
            }
            for profile in pong_rankings
        ]

        return Response({'pong_rankings': response_data}, status=status.HTTP_200_OK)


class SnakeRankingListView(APIView):
    """
    View to get the list of users based on Snake ranking.
    Returns the username and snake_rank value.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users.

    def get(self, request, *args, **kwargs):
        """
        Retrieves all user profiles sorted by Snake rank.

        @param request: The HTTP GET request.
        @return: A JSON response containing the list of users and their Snake ranks.
        """
        snake_rankings = UserProfile.objects.order_by('-snake_rank').select_related('user')  # Retrieves and sorts profiles.

        response_data = [
            {
                'username': profile.user.username,  # Accesses the username directly from the relationship.
                'snake_rank': profile.snake_rank,
                'profile_image_url': profile.profile_image.url if profile.profile_image else None  # Accesses the profile image URL directly.
            }
            for profile in snake_rankings
        ]

        return Response({'snake_rankings': response_data}, status=status.HTTP_200_OK)




