from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile
# from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    friend_list = serializers.ListField(child=serializers.CharField(), required=False)
    blocked_list = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = UserProfile
        fields = ['user', 'alias_name', 'friend_list', 'blocked_list', 'is_logged_in', 'bio', 'two_factor_code', 'two_factor_expiry', 'two_factor_secret',
                  'wins', 'losses', 'pong_wins', 'pong_losses', 'pong_match_history', 'pong_rank',
                  'snake_wins', 'snake_losses', 'snake_match_history', 'snake_rank']
        read_only_fields = ['is_logged_in', 'user']

    def update(self, instance, validated_data):
        instance.friend_list = validated_data.get('friend_list', instance.friend_list)
        instance.blocked_list = validated_data.get('blocked_list', instance.blocked_list)
        instance.bio = validated_data.get('bio', instance.bio)
        instance.alias_name = validated_data.get('alias_name', instance.alias_name)
        instance.two_factor_code = validated_data.get('two_factor_code', instance.two_factor_code)
        instance.two_factor_expiry = validated_data.get('two_factor_expiry', instance.two_factor_expiry)
        instance.two_factor_secret = validated_data.get('two_factor_secret', instance.two_factor_secret)

        # Atualizando os novos campos do modelo UserProfile
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

