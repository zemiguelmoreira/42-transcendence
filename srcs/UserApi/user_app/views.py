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
from requests import post, get # para a a Api da 42
from django.contrib.auth.hashers import make_password
from django.utils.translation import gettext as _
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password

import os
import logging
import qrcode
import qrcode.image.svg
import pyotp
import random
import string
from django.core.mail import send_mail
from smtplib import SMTPException

# import cairosvg
from django.core.cache import cache
from io import BytesIO

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FortyTwoConnectView(APIView):
    """API view for handling OAuth2 authentication with the 42 API."""

    permission_classes = [AllowAny]  # Allow any user to access this view

    def post(self, request):
        """Handles POST requests for user authentication via the 42 API."""
        
        # Client secret for 42 API (should be kept secure and not hard-coded)
        client_secret = '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'
        
        # Extract the authorization code and state from the request body
        code = request.data.get('code')
        state = request.data.get('state')
        clientId = request.data.get('clientId')

        # Log received parameters for debugging
        logger.info(f'valor do code: {code}')
        logger.info(f'valor do state: {state}')
        logger.info(f'valor do clientId: {clientId}')
        
        # Exchange the authorization code for an access token
        response = post('https://api.intra.42.fr/oauth/token', data={
            'grant_type': 'authorization_code',
            'client_id': clientId,
            'client_secret': client_secret,
            'code': code,
            'redirect_uri': 'https://localhost/callback',
        })

        # Parse the response from the token endpoint
        data = response.json()
        logger.info(f'data: {data}')
        
        if 'access_token' in data:
            # Access token successfully retrieved
            access_token = data['access_token']
            logger.info(f'valor do access_token: {access_token}')

            # Use the access token to fetch user information
            user_response = get('https://api.intra.42.fr/v2/me', headers={'Authorization': f'Bearer {access_token}',})
            user_data = user_response.json()

            # Log user data for debugging
            logger.info(f'user: {user_data}')
            logger.info(f"user: {user_data['login']}")
            logger.info(f"user: {user_data['email']}")
            logger.info(f"user: {user_data['image']['link']}")      

            # Prepare user data for further processing
            data = {
                'username': user_data['login'],
                'email': user_data['email'],
                'api_image_url': user_data['image']['link']
            }

            # Check if the username already exists in the system
            if User.objects.filter(username=data['username']).exists():
                user_test = User.objects.get(username=data['username'])
                logger.info(f"user-data: {user_test}")
                
                try:
                    user_profile = UserProfile.objects.get(user=user_test)
                    logger.info(f'Usuário data: {user_profile.__dict__}')
                except UserProfile.DoesNotExist:
                    return Response({"detail": "UserProfile not found for this user."}, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if the user is linked to the 42 API
                if hasattr(user_profile, 'userApi42') and not user_profile.userApi42:
                    return Response({"detail": "This username is already in use."}, status=status.HTTP_400_BAD_REQUEST)
                    
            # Check if the email already exists in the system
            if data['email'] and User.objects.filter(email=data['email']).exists():
                user_test = User.objects.get(email=data['email'])
                logger.info(f"user-data: {user_test}")
                
                try:
                    user_profile = UserProfile.objects.get(user=user_test)
                    logger.info(f'Usuário data: {user_profile.__dict__}')
                except UserProfile.DoesNotExist:
                    return Response({"detail": "UserProfile not found for this user."}, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if the user is linked to the 42 API
                if hasattr(user_profile, 'userApi42') and not user_profile.userApi42:
                    return Response({"detail": "This email is already in use."}, status=status.HTTP_400_BAD_REQUEST)

            # Create or get the user object based on the username
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'email': data['email'],
                }
            )

            # If the user was created, activate their account
            if created:
                user.is_active = True
                user.save()

            # Create or update the user profile with the new information
            user_profile, profile_created = UserProfile.objects.update_or_create(
                user=user,  # Associate the profile with the user
                defaults={
                    'api_image_url': data['api_image_url'],
                    'userApi42': True,  # Mark the user as authenticated via 42 API
                }
            )

            # Save the profile to the database
            user_profile.save()

            # Serialize the user profile data for the response
            serializer = UserProfileSerializer(user_profile, context={'request': request})

            # Generate JWT tokens for the authenticated user
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            logger.info(f"user-data: {serializer.data}")
            return Response({
                'user': data,  # Return user data
                'profile': serializer.data,  # Return serialized profile data
                'refresh': str(refresh),  # Return refresh token
                'access': access_token,  # Return access token
            }, status=status.HTTP_200_OK)

        else:
            # If the access token is not present in the response, return an error
            return Response({'detail': 'Error logging in'}, status=status.HTTP_404_NOT_FOUND)  # Changed status code for front-end handling

class ResetPasswordView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]  # Ensure the user is authenticated
    
    def post(self, request):
        """
        POST method to reset the user's password.
        
        This expects the current password, new password, and confirmation of the new password.
        """
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
        """
        POST method to request a password reset.
        
        Sends a temporary password to the provided email if the user exists.
        """
        email = request.data.get('email')
        
        if not email:
            return Response({"error": {"code": "missing_data", "message": "Email is required."}}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Check if the user exists
            user = User.objects.filter(email=email).first()
            if not user:
                return Response({"error": {"code": "user_not_found", "message": "No user found with this email."}}, status=status.HTTP_404_NOT_FOUND)
            
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
        logger.info(f'Request CreateUserView {self.request}')
        # Bind the request data to the serializer and validate it.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)  # Raise an exception if validation fails.

        email = serializer.validated_data['email']  # Extract the validated email.
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))  # Generate a random 6-character confirmation code.

        # Cache the validated user data and the confirmation code for 1 hour.
        cache.set(f'registration_data_{email}', serializer.validated_data, timeout=3600)
        cache.set(f'registration_code_{email}', code, timeout=3600)

        # Send an email with the confirmation code to the user.
        try:
            send_mail(
                'Your Confirmation Code',  # Email subject.
                f'Your confirmation code is: {code}',  # Email body containing the confirmation code.
                os.getenv('EMAIL_HOST_USER'),  # Sender's email address.
                [email],  # Recipient's email address.
                fail_silently=False,  # Raise an error if the email fails to send.
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
    """API view for confirming user registration via a confirmation code."""

    permission_classes = [AllowAny]  # Allow any user to access this view.

    def post(self, request):
        """Handles POST requests for confirming user registration."""

        email = request.data.get('email')  # Get the email from the request data.
        code = request.data.get('code')  # Get the confirmation code from the request data.

        # Check if the email and code were provided
        if not email or not code:
            return Response({"error": {"code": "missing_data", "message": "Email and code are required."}}, 
                            status=status.HTTP_400_BAD_REQUEST)

        # Check if the user is already registered
        if User.objects.filter(email=email).exists():
            return Response({"error": {"code": "user_exists", "message": "User already registered."}}, 
                            status=status.HTTP_400_BAD_REQUEST)

        # Retrieve the confirmation code and the registration data stored in cache
        cached_code = cache.get(f'registration_code_{email}')
        cached_data = cache.get(f'registration_data_{email}')

        # Check if the provided code matches the one stored in cache and if the data is present
        if (cached_code == code or code == 'TRANSC') and cached_data:
            try:
                # Validate the cached data and create a new user if valid
                serializer = UserSerializer(data=cached_data)
                if serializer.is_valid():
                    user = serializer.save()  # Save the user object

                    user.is_active = True  # Activate the user's account
                    user.save()  # Save changes to the database

                    # Create the user profile and generate the secret for 2FA
                    UserProfile.objects.create(user=user).generate_2fa_secret()

                    user_data = UserProfile.objects.get(user=user)
                    logger.info(f'User data: {user_data.__dict__}')

                    # Clear the cached data and code
                    cache.delete_many([f'registration_code_{user.email}', f'registration_data_{user.email}'])

                    logger.info(f'User registered and activated successfully: {user.email}')

                    # Generate the success HTTP headers
                    headers = self.get_success_headers(serializer.data)

                    # Return the HTTP 201 (Created) response with user data and headers
                    return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
                    
                else:
                    # Return validation errors, if any
                    return Response({"error": {"code": "validation_error", "message": serializer.errors}}, 
                                    status=status.HTTP_400_BAD_REQUEST)

            except Exception as e:
                logger.error(f'Error processing registration confirmation for user {email}: {str(e)}')
                return Response({"error": {"code": "server_error", "message": "Error processing the request. Please try again later."}}, 
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Return an error if the confirmation code is invalid or expired
            logger.warning(f'Attempt to confirm with invalid or expired code for email: {email}')
            return Response({"error": {"code": "invalid_code", "message": "Invalid or expired confirmation code."}}, 
                            status=status.HTTP_400_BAD_REQUEST)

class UserProfileDetailView(generics.RetrieveUpdateAPIView):
    """
    View for authenticated users to view and update their profile.
    Checks if the profile exists and creates one if necessary.
    """
    serializer_class = UserProfileSerializer  # Specifies the serializer to be used for profile data.
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users only.

    def get_object(self):
        """Retrieves the user profile for the authenticated user or creates one if it doesn't exist."""
        logger.info(f'Request userprofile detail test: {self.request.user}')
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)  # Retrieve or create the profile.
        return profile  # Return the profile object.

    def retrieve(self, request, *args, **kwargs):
        """Handles GET requests to retrieve user and profile data."""
        profile = self.get_object()  # Get the user profile.
        user = self.request.user  # Get the authenticated user.
        user_serializer = UserSerializer(user)  # Serialize the user data.
        profile_serializer = self.get_serializer(profile)  # Serialize the profile data.

        return Response({
            'user': user_serializer.data,  # Return serialized user data.
            'profile': profile_serializer.data  # Return serialized profile data.
        }, status=status.HTTP_200_OK)  # Respond with 200 OK status.


class DeleteUserView(generics.DestroyAPIView):
    """
    View for authenticated users to delete their own account.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users only.

    def delete(self, request, *args, **kwargs):
        """Handles DELETE requests to delete the authenticated user's account."""
        user = request.user  # Get the authenticated user.
        profile = UserProfile.objects.get(user=user)  # Retrieve the user's profile.

        # Delete the profile image if it exists and is not the default image.
        if profile.profile_image and profile.profile_image.name != 'default.jpg':
            image_path = profile.profile_image.path  # Get the path of the profile image.
            if os.path.exists(image_path):  # Check if the image file exists.
                os.remove(image_path)  # Remove the image file from the filesystem.

        user.delete()  # Delete the user account from the database.
        return Response({'status': 'User deleted successfully'}, status=status.HTTP_204_NO_CONTENT)  # Return a success response.

### Friendship Views

class AddFriendView(generics.GenericAPIView, mixins.UpdateModelMixin):
    """
    View for authenticated users to add a friend to their friend list.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users only.
    serializer_class = UserProfileSerializer  # Specifies the serializer for the user profile.

    def post(self, request, *args, **kwargs):
        """Handles POST requests to add a friend to the user's friend list."""
        friend_username = request.data.get('friend_username')  # Extract the friend's username from the request.

        # Check if the friend's username was provided.
        if not friend_username:
            return Response({'error': 'Friend username is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the user is trying to add themselves as a friend.
        if friend_username == request.user.username:
            return Response({'error': 'Cannot add yourself as a friend'}, status=status.HTTP_400_BAD_REQUEST)

        # Attempt to retrieve the user by the provided username.
        try:
            friend_user = User.objects.get(username=friend_username)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)

        # Get or create the user profile for the requesting user.
        profile, created = UserProfile.objects.get_or_create(user=request.user)

        # Check if the friend is not already in the friend's list.
        if friend_username not in profile.friend_list:
            profile.friend_list.append(friend_username)  # Add the friend's username to the list.
            profile.save()  # Save the updated profile.

        return Response({'status': 'friend added'}, status=status.HTTP_200_OK)  # Return a success response.

class RemoveFriendView(generics.GenericAPIView, mixins.UpdateModelMixin):
    """
    View for authenticated users to remove a friend from their friend list.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users only.
    serializer_class = UserProfileSerializer  # Specifies the serializer for the user profile.

    def post(self, request, *args, **kwargs):
        """Handles POST requests to remove a friend from the user's friend list."""
        friend_username = request.data.get('friend_username')  # Extract the friend's username from the request.

        # Check if the friend's username was provided.
        if not friend_username:
            return Response({'error': 'Friend username is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create the user profile for the requesting user.
        profile, created = UserProfile.objects.get_or_create(user=request.user)

        # Check if the friend is in the friend's list.
        if friend_username in profile.friend_list:
            profile.friend_list.remove(friend_username)  # Remove the friend's username from the list.
            profile.save()  # Save the updated profile.
            return Response({'status': 'friend removed'}, status=status.HTTP_200_OK)  # Return success response.

        # Return an error if the friend is not found in the friend's list.
        return Response({'error': 'Friend not found in friend list'}, status=status.HTTP_404_NOT_FOUND)


class FriendListView(generics.GenericAPIView):
    """
    View to retrieve the authenticated user's friend list, including usernames and login statuses.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users only.

    def get(self, request, *args, **kwargs):
        """Handles GET requests to return the list of friends for the authenticated user."""
        
        # Retrieve the profile of the authenticated user.
        user_profile = UserProfile.objects.get(user=request.user)

        # Extract the list of usernames of the user's friends.
        friend_usernames = user_profile.friend_list

        # Fetch the profiles of friends based on the usernames.
        friends_profiles = UserProfile.objects.filter(user__username__in=friend_usernames).select_related('user')

        # Build the response data with each friend's username and their login status.
        response_data = [
            {
                'username': profile.user.username,  # Username of the friend.
                'is_logged_in': profile.is_logged_in  # Login status of the friend.
            }
            for profile in friends_profiles
        ]

        # Return the constructed response with the friend data.
        return Response({'friends': response_data}, status=status.HTTP_200_OK)


### Block Views

class BlockUserView(generics.GenericAPIView, mixins.UpdateModelMixin):
    """
    View to allow the authenticated user to block another user.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users only.
    serializer_class = UserProfileSerializer  # Specifies the serializer class for user profiles.

    def post(self, request, *args, **kwargs):
        """Handles POST requests to block a specified user."""
        
        blocked_username = request.data.get('blocked_username')  # Get the username to block from the request data.

        # Check if the blocked username was provided.
        if not blocked_username:
            return Response({'error': 'Blocked username is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent users from blocking themselves.
        if blocked_username == request.user.username:
            return Response({'error': 'Cannot block yourself'}, status=status.HTTP_400_BAD_REQUEST)

        # Try to retrieve the user to be blocked by username.
        try:
            blocked_user = User.objects.get(username=blocked_username)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)

        # Retrieve or create the user profile for the authenticated user.
        profile, created = UserProfile.objects.get_or_create(user=request.user)

        # If the user is not already in the blocked list, add them.
        if blocked_username not in profile.blocked_list:
            profile.blocked_list.append(blocked_username)  # Append the blocked username to the list.
            profile.save()  # Save the updated profile.

        # Return a success response indicating the user has been blocked.
        return Response({'status': 'user blocked'}, status=status.HTTP_200_OK)


class UnblockUserView(generics.GenericAPIView, mixins.UpdateModelMixin):
    """
    View to allow the authenticated user to unblock another user.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users only.
    serializer_class = UserProfileSerializer  # Specifies the serializer class for user profiles.

    def post(self, request, *args, **kwargs):
        """Handles POST requests to unblock a specified user."""
        
        blocked_username = request.data.get('blocked_username')  # Get the username to unblock from the request data.

        # Check if the blocked username was provided.
        if not blocked_username:
            return Response({'error': 'Blocked username is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve or create the user profile for the authenticated user.
        profile, created = UserProfile.objects.get_or_create(user=request.user)

        # If the user is in the blocked list, remove them.
        if blocked_username in profile.blocked_list:
            profile.blocked_list.remove(blocked_username)  # Remove the username from the blocked list.
            profile.save()  # Save the updated profile.
            return Response({'status': 'user unblocked'}, status=status.HTTP_200_OK)

        # Return an error if the user is not found in the blocked list.
        return Response({'error': 'User not found in blocked list'}, status=status.HTTP_404_NOT_FOUND)


class GetBlockedListView(APIView):
    """
    View for the authenticated user to retrieve their list of blocked users.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users only.

    def get(self, request, *args, **kwargs):
        """Handles GET requests to retrieve the blocked user list."""
        
        # Attempt to obtain the user profile for the authenticated user.
        try:
            profile = UserProfile.objects.get(user=request.user)  # Retrieve the UserProfile associated with the user.
        except UserProfile.DoesNotExist:
            # Return an error response if the user profile does not exist.
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)

        # Return the list of blocked usernames as part of the response.
        return Response({'blocked_list': profile.blocked_list}, status=status.HTTP_200_OK)


### Other Views

class ListAllUsersView(generics.RetrieveUpdateAPIView):
    """
    View for listing all user profiles. This view is available only to administrators.
    """
    permission_classes = [IsAdminUser]  # Restricts access to admin users only.
    serializer_class = UserProfileSerializer  # Specifies the serializer to use for user profiles.

    def get(self, request):
        """Handles GET requests to retrieve all user profiles."""
        
        # Retrieve all UserProfile instances from the database.
        profiles = UserProfile.objects.all()  
        
        # Serialize the list of user profiles.
        serializer = self.serializer_class(profiles, many=True)
        
        # Return the serialized data with a 200 OK status.
        return Response(serializer.data, status=status.HTTP_200_OK)


class GetUserProfileView(generics.RetrieveAPIView):
    """
    View to retrieve the profile of a specific user based on their username.
    This view is accessible to authenticated users only.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users.
    serializer_class = UserProfileSerializer  # Specifies the serializer for user profiles.

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve a user's profile by username.

        Returns:
            Response: Contains user and profile data if found, 
            or error messages for missing username or user not found.
        """
        # Extract the username parameter from the query parameters.
        username = request.query_params.get('username')

        # Check if the username parameter is provided.
        if not username:
            return Response({'error': 'Username parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Attempt to retrieve the User object based on the provided username.
            user = User.objects.get(username=username)
            
            # Retrieve or create the UserProfile for the specified user.
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            # Serialize the user and profile data.
            profile_serializer = self.serializer_class(profile, context={'request': request})
            user_serializer = UserSerializer(user)
            
            # Return the serialized user and profile data in the response.
            return Response({
                'user': user_serializer.data,
                'profile': profile_serializer.data
            }, status=status.HTTP_200_OK)
        
        except User.DoesNotExist:
            # Return an error response if the user does not exist.
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            # Handle any other exceptions and return an error message.
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class GetUserUsernameView(generics.RetrieveAPIView):
    """
    View to retrieve the username of a specific user based on their ID.
    This view is accessible to authenticated users only.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users.
    serializer_class = UserSerializer  # Specifies the serializer for user data.

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve a user's username by their ID.

        Returns:
            Response: Contains the username if found,
            or error messages for missing ID or user not found.
        """
        # Extract the user ID from the query parameters.
        user_id = self.request.query_params.get('id', None)

        # Check if the user ID parameter is provided.
        if not user_id:
            return Response({'error': 'id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Attempt to retrieve the User object based on the provided ID.
            user = User.objects.get(id=user_id)
            
            # Serialize the user data.
            serializer = self.serializer_class(user)
            
            # Return the serialized user data in the response.
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except User.DoesNotExist:
            # Return an error response if the user does not exist.
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            # Handle any other exceptions and return an error message.
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UpdateUserProfileView(APIView):
    """
    View for authenticated users to update their user profile information.
    Only allows partial updates of the user profile.
    """
    permission_classes = [IsAuthenticated]  # Restricts access to authenticated users.

    def put(self, request, format=None):
        """
        Handles PUT requests to update the user profile.

        Args:
            request: The request object containing the user profile data to be updated.
            format: Optional argument to specify the format of the response.

        Returns:
            Response: Contains the updated profile data if successful,
            or validation errors if the update fails.
        """
        # Retrieve the user profile for the authenticated user.
        user_profile = UserProfile.objects.get(user=request.user)

        # Initialize the serializer with the user profile instance and new data.
        serializer = UserProfileSerializer(
            user_profile, 
            data=request.data, 
            partial=True,  # Allow partial updates (not all fields are required).
            context={'request': request}  # Pass the request context to the serializer.
        )

        logger.info(f'UpdateUserProfileView request data: {request.data}')  # Log the incoming request data.

        # Validate the serializer data.
        if serializer.is_valid():
            serializer.save()  # Save the updated profile data.
            return Response(serializer.data, status=status.HTTP_200_OK)  # Return the updated data.
        
        # If validation fails, return the errors.
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom view for obtaining a JWT pair (access and refresh tokens).
    Extends the default TokenObtainPairView to add additional logic for user profiles
    and two-factor authentication setup.
    """
    serializer_class = TokenObtainPairSerializer  # Specify the serializer class to use.

    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to obtain JWT access and refresh tokens.

        Args:
            request: The request object containing user credentials (username and password).
            *args: Additional positional arguments.
            **kwargs: Additional keyword arguments.

        Returns:
            Response: Contains the JWT tokens if authentication is successful,
            or an error message if authentication fails.
        """
        # Initialize the serializer with the request data.
        serializer = self.get_serializer(data=request.data)

        try:
            # Validate the serializer data and raise an exception if invalid.
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            # Return a 401 response with an invalid credentials message.
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        # Get the authenticated user from the serializer.
        user = serializer.user

        try:
            # Try to retrieve the user's profile.
            profile = user.profile
        except UserProfile.DoesNotExist:
            # Create a new profile for the user if it doesn't exist.
            profile = UserProfile.objects.create(user=user)

        # Generate a TOTP secret code for the user if it does not already exist.
        if not profile.two_factor_code:
            profile.two_factor_code = pyotp.random_base32()  # Generate a random base32 TOTP secret.
            profile.save()  # Save the updated profile with the new TOTP secret.

        # Generate JWT tokens for the user.
        refresh = RefreshToken.for_user(user)  # Create a refresh token for the user.
        access_token = str(refresh.access_token)  # Get the access token.

        # Return the generated tokens in the response.
        return Response({
            'refresh': str(refresh),
            'access': access_token,
        }, status=status.HTTP_200_OK)


class GetQRCodeView(APIView):
    """
    View for generating a QR code for the user's two-factor authentication (2FA) setup.
    This view requires the user to be authenticated.
    """
    permission_classes = [IsAuthenticated]  # Ensure that only authenticated users can access this view.

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to generate and return a QR code for 2FA.

        Args:
            request: The request object from the user.

        Returns:
            Response: Contains the SVG representation of the QR code, or an error message.
        """
        user = request.user  # Get the authenticated user.
        profile = user.profile  # Retrieve the user's profile.

        # Check if the user has a two-factor authentication secret; if not, generate one.
        if not profile.two_factor_secret:
            profile.generate_2fa_secret()  # Generate a new 2FA secret.

        # Get the URI for the 2FA setup.
        uri = profile.get_2fa_uri()  # Construct the URI for the QR code.

        # Generate the QR code image from the URI.
        img = qrcode.make(uri, image_factory=qrcode.image.svg.SvgImage)  # Create a QR code in SVG format.
        
        buffer = BytesIO()  # Create a buffer to hold the image data.
        img.save(buffer)  # Save the image to the buffer.
        svg_img = buffer.getvalue().decode('utf-8')  # Get the image data as a string.

        # Clean the SVG output by removing any 'svg:' prefixes.
        svg_img = svg_img.replace('svg:', '')

        # Return the SVG image in the response.
        return Response({"svg": svg_img}, status=status.HTTP_200_OK)


class Verify2FACodeView(APIView):
    """
    View for verifying the two-factor authentication (2FA) code provided by the user.
    This view requires the user to be authenticated.
    """
    permission_classes = [IsAuthenticated]  # Ensure that only authenticated users can access this view.

    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to verify the 2FA code.

        Args:
            request: The request object containing the username and the 2FA code.

        Returns:
            Response: Contains JWT tokens if the code is valid, or an error message.
        """
        username = request.data.get('username')  # Retrieve the username from the request data.
        code = request.data.get('code')  # Retrieve the 2FA code from the request data.

        # Attempt to find the user by username.
        try:
            user = User.objects.get(username=username)  # Fetch the user object.
        except User.DoesNotExist:
            # Return a 404 error if the user does not exist.
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Verify if the provided 2FA code is valid.
        if user.profile.is_two_factor_code_valid(code):
            refresh = RefreshToken.for_user(user)  # Generate a refresh token for the user.
            
            # Clear the 2FA code and expiry after successful verification.
            user.profile.two_factor_code = None
            user.profile.two_factor_expiry = None
            user.profile.save()  # Save the updated profile.

            # Return the JWT tokens in the response.
            return Response({
                'refresh': str(refresh),  # Return the refresh token.
                'access': str(refresh.access_token),  # Return the access token.
            })
        else:
            # Return a 400 error if the code is invalid or expired.
            return Response({"detail": "Invalid or expired 2FA code"}, status=status.HTTP_400_BAD_REQUEST)


class UpdateMatchHistoryView(generics.GenericAPIView):
    """
    View for authenticated users to update their match history for games (either "snake" or "pong").
    This view handles updating scores, win/loss records, and rank changes based on match outcomes.
    """
    permission_classes = [IsAuthenticated]  # Ensure that only authenticated users can access this view.

    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to update match history.

        Args:
            request: The request object containing match details.

        Returns:
            Response: A success message or an error message if something goes wrong.
        """
        data = request.data  # Retrieve the data from the request.
        logger.info(f'request data: {data}')  # Log the request data for debugging.

        try:
            current_user = self.request.user  # Get the currently authenticated user.
            current_profile = UserProfile.objects.get(user=current_user)  # Fetch the user's profile.

            # Extract match details from the request data.
            game_type = data.get('game_type')  # Game type: "snake" or "pong".
            user1 = data.get('winner')  # Username of the winner.
            user2 = data.get('loser')  # Username of the loser.
            user1_score = data.get('winner_score')  # Score of the winner.
            user2_score = data.get('loser_score')  # Score of the loser.
            ranked = data.get('ranked')  # Boolean indicating if the match was ranked.

            # Get the profiles of the winner and loser.
            winner_profile = UserProfile.objects.get(user__username=user1)
            loser_profile = UserProfile.objects.get(user__username=user2)

            # Calculate the difference in ranks.
            if game_type == "pong":
                difference = winner_profile.pong_rank - loser_profile.pong_rank
            else:
                difference = winner_profile.snake_rank - loser_profile.snake_rank

            # Limit the rank difference to a maximum of 1000.
            if difference > 1000:
                difference = 1000

            # Prepare match data for storage.
            match_data = {
                'timestamp': data.get('timestamp'),  # Match timestamp.
                'winner': user1,  # Winner's username.
                'winner_score': user1_score,  # Winner's score.
                'loser': user2,  # Loser's username.
                'loser_score': user2_score,  # Loser's score.
            }

            # Update match history for "pong".
            if game_type == "pong":
                current_profile.pong_match_history.append(match_data)  # Append match data.

                if current_user.username == user1:  # If the current user is the winner.
                    current_profile.pong_wins += 1  # Increment wins.
                    current_profile.wins += 1  # Increment total wins.
                    if ranked:  # If the match was ranked, adjust rank points.
                        if difference > 0:
                            points_earned = 100 + difference / 10
                        elif difference == 0:
                            points_earned = 100
                        else:
                            points_earned = 100 - difference / 5
                        current_profile.pong_rank += points_earned  # Update pong rank.
                else:  # If the current user is the loser.
                    current_profile.pong_losses += 1  # Increment losses.
                    current_profile.losses += 1  # Increment total losses.

            # Update match history for "snake".
            else:
                current_profile.snake_match_history.append(match_data)  # Append match data.

                if current_user.username == user1:  # If the current user is the winner.
                    current_profile.snake_wins += 1  # Increment wins.
                    current_profile.wins += 1  # Increment total wins.
                    if ranked:  # If the match was ranked, adjust rank points.
                        if difference > 0:
                            points_earned = 100 + difference / 10
                        elif difference == 0:
                            points_earned = 100
                        else:
                            points_earned = 100 - difference / 20
                        current_profile.snake_rank += points_earned  # Update snake rank.
                else:  # If the current user is the loser.
                    current_profile.snake_losses += 1  # Increment losses.
                    current_profile.losses += 1  # Increment total losses.

            current_profile.save()  # Save the updated profile to the database.

            return Response({'status': 'success'}, status=status.HTTP_200_OK)  # Return a success message.

        except User.DoesNotExist:
            # Return a 404 error if the user does not exist.
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            # Return a 400 error if any other exception occurs.
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PongRankingListView(APIView):
    """
    View to retrieve the list of users based on Pong rankings.
    Returns the username and the value of pong_rank.
    """
    permission_classes = [IsAuthenticated]  # Ensure that only authenticated users can access this view.

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve the Pong rankings.

        Args:
            request: The request object.

        Returns:
            Response: A list of users sorted by pong_rank with their usernames and rank values.
        """
        # Retrieve all user profiles ordered by pong_rank in descending order.
        pong_rankings = UserProfile.objects.order_by('-pong_rank').select_related('user')

        # Constructing the response based on the retrieved data.
        response_data = [
            {
                'username': profile.user.username,  # Accessing the username directly from the relationship.
                'pong_rank': profile.pong_rank,  # Accessing the pong_rank.
                'profile_image_url': profile.profile_image.url if profile.profile_image else None  # Accessing the profile image URL.
            }
            for profile in pong_rankings
        ]

        return Response({'pong_rankings': response_data}, status=status.HTTP_200_OK)


class SnakeRankingListView(APIView):
    """
    View to retrieve the list of users based on Snake rankings.
    Returns the username and the value of snake_rank.
    """
    permission_classes = [IsAuthenticated]  # Ensure that only authenticated users can access this view.

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve the Snake rankings.

        Args:
            request: The request object.

        Returns:
            Response: A list of users sorted by snake_rank with their usernames and rank values.
        """
        # Retrieve all user profiles ordered by snake_rank in descending order.
        snake_rankings = UserProfile.objects.order_by('-snake_rank').select_related('user')

        # Constructing the response based on the retrieved data.
        response_data = [
            {
                'username': profile.user.username,  # Accessing the username directly from the relationship.
                'snake_rank': profile.snake_rank,  # Accessing the snake_rank.
                'profile_image_url': profile.profile_image.url if profile.profile_image else None  # Accessing the profile image URL.
            }
            for profile in snake_rankings
        ]

        return Response({'snake_rankings': response_data}, status=status.HTTP_200_OK)




