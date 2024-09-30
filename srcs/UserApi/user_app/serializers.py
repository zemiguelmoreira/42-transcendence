from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile
from django.conf import settings
import os
from datetime import datetime
from user_app.validators import CustomPasswordValidator
import logging
from django.core.exceptions import ValidationError
import re  # Import the regular expression module for string validation

# Configure logging to capture debug information
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class UserSerializer(serializers.ModelSerializer):
    """Serializer for creating and validating User instances."""

    # Define the fields for the user creation serializer
    email = serializers.EmailField(required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    username = serializers.CharField(required=True, max_length=8)  # Limit username length to 8 characters

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'confirm_password']
        extra_kwargs = {'password': {'write_only': True}}  # Ensure password is not exposed in responses

    def validate(self, data):
        """Validate the provided user data before creation."""
        
        # Check if the email is already in use
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "This email is already in use."})

        # Check if the username is already in use
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "This username is already in use."})

        # Check if the passwords match
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})

        # Validate username format
        self.validate_username(data['username'])  # Call the custom validation method

        # Validate password using the custom password validator
        password_validator = CustomPasswordValidator()
        try:
            password_validator.validate(data['password'])  # This will raise a ValidationError if the password is invalid
        except ValidationError as e:
            raise serializers.ValidationError({"password": e.messages})

        # Return validated data for use in user creation
        return data

    def validate_username(self, value):
        """Ensure the username contains only lowercase letters, hyphens, and numbers, and is no more than 8 characters long."""
        if not re.match(r'^[a-z0-9-]+$', value):
            raise serializers.ValidationError("Username must contain only lowercase letters, numbers, and hyphens.")
        
        if len(value) > 8:  # Check if the username exceeds 8 characters
            raise serializers.ValidationError("Username must be 8 characters or fewer.")
        
        return value

    def create(self, validated_data):
        """Create a new User instance from validated data."""
        # Remove the confirm_password from the validated data
        validated_data.pop('confirm_password', None)
        print("Validated data before user creation:", validated_data)
        user = User.objects.create_user(**validated_data)  # Create the user with the validated data
        print(f"User created: {user}")
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for handling UserProfile data."""
    
    friend_list = serializers.ListField(child=serializers.CharField(), required=False)
    blocked_list = serializers.ListField(child=serializers.CharField(), required=False)
    profile_image_url = serializers.SerializerMethodField()  # Custom field to retrieve the full URL of the profile image

    class Meta:
        model = UserProfile
        fields = ['user', 'alias_name', 'friend_list', 'blocked_list', 'is_logged_in', 'bio', 
                  'two_factor_code', 'two_factor_expiry', 'two_factor_secret',
                  'wins', 'losses', 'pong_wins', 'pong_losses', 'pong_match_history', 'pong_rank',
                  'snake_wins', 'snake_losses', 'snake_match_history', 'snake_rank', 'userApi42', 
                  'profile_image', 'api_image_url', 'profile_image_url']
        read_only_fields = ['user']  # Prevent modification of the user field

    def get_profile_image_url(self, obj):
        """Return the absolute URL of the profile image or API image URL if applicable."""
        request = self.context.get('request')

        api_image_url = obj.api_image_url
        if api_image_url and (obj.profile_image and obj.profile_image.name == 'default.jpg'):
            return api_image_url

        if obj.profile_image:
            url = request.build_absolute_uri(obj.profile_image.url)  # Create an absolute URL for the image
            return url.replace('http://', 'https://')  # Ensure URL uses HTTPS
        return None

    def validate_profile_image(self, value):
        """Ensure the uploaded profile image meets criteria (image type and size)."""
        if not value.content_type.startswith('image'):
            raise serializers.ValidationError("The file is not an image.")
        max_size = 1 * 1024 * 1024  # 5 MB
        if value.size > max_size:
            raise serializers.ValidationError(f"The image must be at most {max_size / (1024 * 1024)} MB.")
        return value

    def validate_alias_name(self, value):
        """Ensure the alias_name contains only letters (upper and lower case), numbers, and hyphens, and is up to 8 characters long."""
        if not re.match(r'^[a-zA-Z0-9-]+$', value):
            raise serializers.ValidationError("Alias name must contain only letters (upper and lower case), numbers, and hyphens.")
        
        if len(value) > 8:  # Check if the alias name exceeds 8 characters
            raise serializers.ValidationError("Alias name must be 8 characters or fewer.")
        
        return value

    def update(self, instance, validated_data):
        """Update an existing UserProfile instance with new data."""
        instance.friend_list = validated_data.get('friend_list', instance.friend_list)
        instance.blocked_list = validated_data.get('blocked_list', instance.blocked_list)
        instance.is_logged_in = validated_data.get('is_logged_in', instance.is_logged_in)
        instance.bio = validated_data.get('bio', instance.bio)
        instance.alias_name = validated_data.get('alias_name', instance.alias_name)
        instance.two_factor_code = validated_data.get('two_factor_code', instance.two_factor_code)
        instance.two_factor_expiry = validated_data.get('two_factor_expiry', instance.two_factor_expiry)
        instance.two_factor_secret = validated_data.get('two_factor_secret', instance.two_factor_secret)

        profile_image = validated_data.get('profile_image', None)
        logger.info(f"Profile image: {profile_image}")
        
        if profile_image:
            # Validate and potentially remove the old profile image
            if instance.profile_image and instance.profile_image.name != 'default.jpg':
                self.validate_profile_image(profile_image)

                old_image_path = instance.profile_image.path
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)  # Remove the old image file

            # Rename and assign the new profile image to the instance
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")  # Create a timestamp for the new image filename
            profile_image.name = f"{instance.user.username}_{timestamp}_profile.jpg"
            instance.profile_image = profile_image

        # Update additional fields
        instance.wins = validated_data.get('wins', instance.wins)
        instance.losses = validated_data.get('losses', instance.losses)
        instance.pong_wins = validated_data.get('pong_wins', instance.pong_wins)
        instance.pong_losses = validated_data.get('pong_losses', instance.pong_losses)
        instance.pong_match_history = validated_data.get('pong_match_history', instance.pong_match_history)
        instance.pong_rank = validated_data.get('pong_rank', instance.pong_rank)
        instance.snake_wins = validated_data.get('snake_wins', instance.snake_wins)
        instance.snake_losses = validated_data.get('snake_losses', instance.snake_losses)
        instance.snake_match_history = validated_data.get('snake_match_history', instance.snake_match_history)
        instance.snake_rank = validated_data.get('snake_rank', instance.snake_rank)

        instance.save()  # Save the updated instance to the database
        return instance
