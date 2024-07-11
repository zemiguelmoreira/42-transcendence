from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile
# from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):

    email = serializers.EmailField(required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'confirm_password']
        extra_kwargs = {'password': {'write_only': True}}


    def validate(self, data):
        # Verifica se o email já está em uso
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "This email is already in use."})

        # Verifica se as senhas correspondem
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match"})
        
        # Retorna os dados validados, usado para dizer ao Rest que os dados passaram a validação e podem ser utilizados
        return data
    
    def create(self, validated_data):
        #retirar o confirm_password da criação do user
        validated_data.pop('confirm_password', None)
        print("Validated data before user creation:", validated_data)
        user = User.objects.create_user(**validated_data)
        print(f"User created: {user}")
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    friend_list = serializers.ListField(child=serializers.CharField(), required=False)
    blocked_list = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = UserProfile
        fields = ['user', 'friend_list', 'blocked_list', 'is_logged_in', 'bio', ]
        read_only_fields = ['is_logged_in']

    def update(self, instance, validated_data):
        instance.friend_list = validated_data.get('friend_list', instance.friend_list)
        instance.blocked_list = validated_data.get('blocked_list', instance.blocked_list)
        instance.bio = validated_data.get('bio', instance.bio)
        instance.save()
        return instance