from rest_framework import serializers

class KeyPressSerializer(serializers.Serializer):
    keyCode = serializers.IntegerField()