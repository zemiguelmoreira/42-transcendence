from rest_framework.views import APIView
from django.contrib.auth.hashers import check_password
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .serializers import UserProfileSerializer
from django.middleware.csrf import get_token
from .models import UserProfile, UserCredentials
from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.tokens import RefreshToken
from django.middleware.csrf import get_token
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt # para testes
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import get_object_or_404
import logging

logger = logging.getLogger(__name__)

# função para fazer o registo do user não utiliza A APIView
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):

        csrf_token_header = request.META.get('HTTP_X_CSRFTOKEN')
        print('Token CSRF no cabeçalho:', csrf_token_header)
        if not csrf_token_header:
            return Response({'error': 'Csrf Token not found'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
        serializer = UserProfileSerializer(data=request.data)
        if serializer.is_valid():
            password = request.data.get('password')
            confirm_password = request.data.get('confirm_password')
            
            if password != confirm_password:
                return Response({'error': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)

            # Salvar o usuário e a senha
            user_profile = serializer.save()
            password_hash = make_password(password)
            UserCredentials.objects.create(user=user_profile, password_hash=password_hash)
            
            try:
                # Gera os tokens para o usuário
                refresh = RefreshToken.for_user(user_profile)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)

                logger.info(f'Token gerado para usuário {user_profile.username} {access_token}')
                logger.info(f'Token válido até: {refresh.access_token.payload["exp"]}')
                logger.info(f'RefreshToken: {refresh_token}')
        
                # user_profile_serializer = UserProfileSerializer(user_profile)
                # username = user_profile_serializer.data.get('username')
                username = user_profile.username

                return Response({
                    'status': 'success',
                    'message': 'Formulário válido!',
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'user': username,
                    'additional_message': 'User profile created successfully'
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f'Erro ao gerar tokens: {str(e)}')
                return Response({'error': 'Error generating tokens'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)



# Função do token crsf

@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    csrf_token = get_token(request)
    return Response({'csrfToken': csrf_token})


@api_view(['POST'])
@permission_classes([AllowAny])
def get_user_id(request):
    user_name = request.data.get('user')
    
    try:
        user_profile = UserProfile.objects.get(username=user_name)
        return Response({
            'id': user_profile.id
        }, status=status.HTTP_200_OK)
    except UserProfile.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_400_BAD_REQUEST)
    

# função para fazer login utilizador com APIView

# @api_view(['POST']) se colocar nãp posso utilizar o as_view()
# @csrf_protect
# @method_decorator(csrf_protect, name='dispatch')
class LoginView(APIView):
    def post(self, request):
        csrf_token_header = request.META.get('HTTP_X_CSRFTOKEN')
        print('Token CSRF no cabeçalho:', csrf_token_header)

        if not csrf_token_header:
            return Response({'error': 'Csrf Token not found'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        user_or_email = request.data.get('username')
        password = request.data.get('password')
        user_credentials = None

        try:
            user_profile = UserProfile.objects.get(username=user_or_email)
        except UserProfile.DoesNotExist:
            try:
                user_profile = UserProfile.objects.get(email=user_or_email)
            except UserProfile.DoesNotExist:
                return Response({'error': 'Invalid username, email or password'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_credentials = UserCredentials.objects.get(user=user_profile)
        except UserCredentials.DoesNotExist:
            return Response({'error': 'Invalid username or password'}, status=status.HTTP_400_BAD_REQUEST)

        if check_password(password, user_credentials.password_hash):
            try:
                # Generate tokens
                refresh = RefreshToken.for_user(user_profile)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)

                serializer = UserProfileSerializer(user_profile)
                serialized_data = serializer.data

                print('Access token:', access_token)
                print('Refresh token:', refresh_token)
                print('Dados do usuário:', serialized_data)

                return Response({
                    'message': 'Login successful',
                    'user': serialized_data,
                    'access_token': access_token,
                    'refresh_token': refresh_token
                }, status=status.HTTP_200_OK)
            
            except Exception as e:
                return Response({'error': 'An error occurred while generating tokens', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response({'error': 'Invalid username or password'}, status=status.HTTP_400_BAD_REQUEST)



# função para teste utilização do token com APIView
# @method_decorator(csrf_exempt, name='dispatch')
class ProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'message': 'This is protected data.'})



# @method_decorator(csrf_exempt, name='dispatch')
class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        # Verificar as credenciais do usuário
        user = UserProfile.objects.get(username=username)
        if user is None or not check_password(password, user.usercredentials.password_hash):
            return Response({"detail": "Username or password is incorrect"}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Gerar tokens de acesso e atualização
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        return Response({
            'access_token': access_token,
            'refresh_token': refresh_token
        })

@method_decorator(csrf_exempt, name='dispatch')
class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request):
        refresh_token = request.data.get('refresh')
        
        # Verificar e atualizar o token de atualização
        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            return Response({'access_token': access_token})
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_401_UNAUTHORIZED)



# teste
class Home(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        content = {'message': 'Hello, World!'}
        return Response(content)


# Get user data by id
@api_view(['GET'])
@permission_classes([AllowAny])
def user_profile_api_view(request, user_id):

    csrf_token_header = request.META.get('HTTP_X_CSRFTOKEN')
    print('Token CSRF no cabeçalho:', csrf_token_header)
    if not csrf_token_header:
        return Response({'error': 'Csrf Token not found'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        user = get_object_or_404(UserProfile, pk=user_id)
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)
    except UserProfile.DoesNotExist:
        return Response({"error": "User profile not found"}, status=404)

@api_view(['DELETE'])
@permission_classes([AllowAny])    
def delete_account(request, user_id):
    # Obtém o token CSRF do cabeçalho da solicitação
    csrf_token_header = request.META.get('HTTP_X_CSRFTOKEN')
    print('Token CSRF no cabeçalho:', csrf_token_header)
    if not csrf_token_header:
        return Response({'error': 'Csrf Token not found'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:

        user = get_object_or_404(UserProfile, pk=user_id)
        serializer = UserProfileSerializer(user)

        print(f"User with ID {user_id} would be deleted here.")
        
        return Response(serializer.data)
    except UserProfile.DoesNotExist:
        return Response({"error": "User profile not found"}, status=status.HTTP_404_NOT_FOUND)
    
@api_view(['PUT'])
@permission_classes([AllowAny])
def change_profile(request, user_id):

    csrf_token_header = request.META.get('HTTP_X_CSRFTOKEN')
    print('Token CSRF no cabeçalho:', csrf_token_header)
    if not csrf_token_header:
        return Response({'error': 'Csrf Token not found'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        user = get_object_or_404(UserProfile, pk=user_id)
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)
    except UserProfile.DoesNotExist:
        return Response({"error": "User profile not found"}, status=404)