from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile
from django.conf import settings
import os
from datetime import datetime
from user_app.validators import CustomPasswordValidator
import logging
from django.core.exceptions import ValidationError
from urllib.parse import urlparse, urlunparse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    username = serializers.CharField(required=True, max_length=20)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'confirm_password']
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, data):
        # Check if the email is already in use
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "This email is already in use."})

        # Check if the username is already in use
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "This username is already in use."})

        # Check if the passwords match
        if data['password'] != data['confirm_password']:
            logger.info(f'password {data["password"]}')
            logger.info(f'confirm password {data["confirm_password"]}')
            raise serializers.ValidationError({"password": "Passwords do not match."})

        # Check username length
        if len(data['username']) > 8:
            raise serializers.ValidationError({"username": "Username must be 8 characters or fewer. Please choose a shorter name."})

        # Validate password using the custom password validator
        password_validator = CustomPasswordValidator()
        try:
            password_validator.validate(data['password'])
        except ValidationError as e:
            raise serializers.ValidationError({"password": e.messages})

        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        print("Validated data before user creation:", validated_data)
        user = User.objects.create_user(**validated_data)
        print(f"User created: {user}")
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    friend_list = serializers.ListField(child=serializers.CharField(), required=False)
    blocked_list = serializers.ListField(child=serializers.CharField(), required=False)
    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['user', 'alias_name', 'friend_list', 'blocked_list', 'is_logged_in', 'bio', 'two_factor_code', 'two_factor_expiry', 'two_factor_secret',
                  'wins', 'losses', 'pong_wins', 'pong_losses', 'pong_match_history', 'pong_rank',
                  'snake_wins', 'snake_losses', 'snake_match_history', 'snake_rank', 'userApi42', 'profile_image', 'api_image_url', 'profile_image_url']
        read_only_fields = ['user']

    def get_profile_image_url(self, obj):
        request = self.context.get('request')
        api_image_url = obj.api_image_url
        if api_image_url and (obj.profile_image and obj.profile_image.name == 'default.jpg'):
            return api_image_url

        if obj.profile_image:
            url = request.build_absolute_uri(obj.profile_image.url)
            parsed_url = urlparse(url)
            new_netloc = f"{parsed_url.hostname}"
            new_url = urlunparse(('https', new_netloc, parsed_url.path, parsed_url.params, parsed_url.query, parsed_url.fragment))
            return new_url
        return None

    def validate_profile_image(self, value):
        if not value.content_type.startswith('image'):
            raise serializers.ValidationError("The file is not an image.")
        max_size = 5 * 1024 * 1024  # 5 MB
        if value.size > max_size:
            raise serializers.ValidationError(f"The image must be at most {max_size / (1024 * 1024)} MB.")
        return value

    def update(self, instance, validated_data):
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
            if instance.profile_image and instance.profile_image.name != 'default.jpg':
                self.validate_profile_image(profile_image)

                old_image_path = instance.profile_image.path
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)

            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            profile_image.name = f"{instance.user.username}_{timestamp}_profile.jpg"
            instance.profile_image = profile_image

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

        instance.save()
        return instance
