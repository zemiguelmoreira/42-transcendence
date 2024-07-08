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
        fields = ['user', 'friend_list', 'blocked_list', 'is_logged_in', 'bio', 'two_factor_code', 'two_factor_expiry']
        read_only_fields = ['is_logged_in', 'user']  # 'user' é somente leitura para atualizações

    def update(self, instance, validated_data):
        instance.friend_list = validated_data.get('friend_list', instance.friend_list)
        instance.blocked_list = validated_data.get('blocked_list', instance.blocked_list)
        instance.bio = validated_data.get('bio', instance.bio)
        instance.two_factor_code = validated_data.get('two_factor_code', instance.two_factor_code)
        instance.two_factor_expiry = validated_data.get('two_factor_expiry', instance.two_factor_expiry)
        instance.save()
        return instance
