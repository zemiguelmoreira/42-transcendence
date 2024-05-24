# serializers.py
from rest_framework import serializers
from .models import UserProfile, UserCredentials
from django.contrib.auth.hashers import make_password

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['username', 'email', 'photo_path']


class UserCredentialsSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = UserCredentials
        fields = ['user', 'username', 'password']

    def create(self, validated_data):
        validated_data['password_hash'] = make_password(validated_data.pop('password'))
        return super(UserCredentialsSerializer, self).create(validated_data)
