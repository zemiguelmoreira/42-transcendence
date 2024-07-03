# serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
# from django.contrib.auth.hashers import check_password
from .models import UserProfile
# from django.contrib.auth.hashers import make_password


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'photo_path', 'friendList', 'blockList', 'is_online']
