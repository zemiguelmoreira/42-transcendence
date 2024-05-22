# Create your views here.

from rest_framework.views import APIView
from django.contrib.auth.hashers import check_password
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import UserProfile, Token
from .serializers import UserProfileSerializer
from django.middleware.csrf import get_token
from .models import UserProfile, UserCredentials
from django.contrib.auth.hashers import make_password
from .utils import generate_token, verificar_token_cookie
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class UserProfileListCreate(generics.ListCreateAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer

@api_view(['POST'])
def register_user(request):
    serializer = UserProfileSerializer(data=request.data)
    if serializer.is_valid():
        # Validar se as senhas correspondem
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')
        if password != confirm_password:
            return Response({'error': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)

        # Salvar o usuário a senha criar token e guarda-lo
        user_profile = serializer.save()
        password_hash = make_password(password)
        UserCredentials.objects.create(user=user_profile, username=user_profile.username, password_hash=password_hash)
        token, exp_time = generate_token(user_profile)
        logger.info(f'Token gerado para usuário {user_profile.username} {token}')
        logger.info(f'Token valido até: {exp_time}')
        Token.objects.create(user=user_profile, token=token, data_expiracao=exp_time)
        # return Response({'message': 'User profile created successfully'}, status=status.HTTP_201_CREATED)
        user_profile_serializer = UserProfileSerializer(user_profile)
        username = user_profile_serializer.data.get('username')
        return Response({
			'status': 'success',
			'message': 'Formulário válido!',
			'token': token,
			'user': username,
			'additional_message': 'User profile created successfully'
		}, status=status.HTTP_201_CREATED)
    return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_csrf_token(request):
    csrf_token = get_token(request)
    return Response({'csrfToken': csrf_token})

# class LoginView(APIView):
#     def post(self, request):
#         username = request.data.get('username')
#         password = request.data.get('password')

#         try:
#             user_credentials = UserCredentials.objects.get(username=username)
#         except UserCredentials.DoesNotExist:
#             return Response({'error': 'Invalid username or password'}, status=status.HTTP_400_BAD_REQUEST)

#         if check_password(password, user_credentials.password_hash):
#             return Response({'message': 'Login successful'}, status=status.HTTP_200_OK)
#         else:
#             return Response({'error': 'Invalid username or password'}, status=status.HTTP_400_BAD_REQUEST)
