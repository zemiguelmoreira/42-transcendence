
# Create your views here.
from rest_framework.views import APIView
from django.contrib.auth.hashers import check_password
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .serializers import UserProfileSerializer
from django.middleware.csrf import get_token
from .models import UserProfile, UserCredentials
from django.contrib.auth.hashers import make_password
from .utils import verificar_token_cookie, set_token_cookie
from urllib.parse import unquote
# from django.views.decorators.csrf import csrf_protect
from django.middleware.csrf import CsrfViewMiddleware, get_token
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)






# função para listar users
class UserProfileListCreate(generics.ListCreateAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    
# def get_response(request):
#     if not request.user.is_authenticated:
#         return Response({"mensagem": "Você não tem permissão para acessar este recurso."}, status=status.HTTP_403_FORBIDDEN)
#     if request.method == 'POST':
#         return Response({'message': 'POST request processed'}, status=200)
#     return Response({'message': 'Middleware processing completed'}, status=200)




# função para fazer o registo do user não utiliza A APIView
@api_view(['POST']) #só permite pedidos post
# @csrf_protect
# @csrf_exempt para usar a middleware para verificar o token crsf temos de desligar a middleware na view
def register_user(request):
    # csrf_middleware = CsrfViewMiddleware(get_response)
    # csrf_middleware.process_view(request, None, register_user, None)
    # print('request:', request.data)
    crsf_token = get_token(request)
    print('crsf: ', crsf_token)
    if crsf_token:
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
            UserCredentials.objects.create(user=user_profile, password_hash=password_hash)
            
            try:
                # credentials = UserCredentials.objects.get(user=user_profile)
                # token = credentials.token
                token = user_profile.usercredentials.token
                exp_time = user_profile.usercredentials.data_expiracao
                logger.info(f'Token gerado para usuário {user_profile.username} {token}')
                logger.info(f'Token valido até: {exp_time}')
        
                user_profile_serializer = UserProfileSerializer(user_profile)
                username = user_profile_serializer.data.get('username')

                return Response({
                    'status': 'success',
                    'message': 'Formulário válido!',
                    'token': token,
                    'user': username,
                    'additional_message': 'User profile created successfully'
                }, status=status.HTTP_201_CREATED)
            except UserCredentials.DoesNotExist: #isto é uma exeção - erro
                return Response({'error': 'User credentials not found'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
            #return Response({'error': 'Invalid user or email'}, status=status.HTTP_400_BAD_REQUEST)
    else:
         return Response({'error': 'Csrf Token not found'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




# Função do token crsf
@api_view(['GET'])
def get_csrf_token(request):
    csrf_token = get_token(request)
    return Response({'csrfToken': csrf_token})





# função para fazer login utilizador
# @api_view(['POST']) se colocar nãp posso utilizar o as_view()
class LoginView(APIView):
    def post(self, request):
        crsf_token = get_token(request)
        print('crsf: ', crsf_token)

        # verifica o token crsf
        if not crsf_token:
            return Response({'error': 'Csrf Token not found'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # extrai o user ou email e password do request
        user_or_email = request.data.get('username')
        password = request.data.get('password')
        user_credentials = None

        # procura o user
        try:
            # serializer_class = UserProfileSerializer
            user_profile = UserProfile.objects.get(username=user_or_email)
            # user_credentials = UserCredentials.objects.get(user=user_profile)
            # print(user_credentials)
        except UserProfile.DoesNotExist:
            try:
                user_credentials = UserProfile.objects.get(email=user_or_email)
            except UserProfile.DoesNotExist:
                return Response({'error': 'Invalid username, email or password'}, status=status.HTTP_400_BAD_REQUEST)

        # user_credentials = UserCredentials.objects.get(user=user_profile)
        try:
            user_credentials = UserCredentials.objects.get(user=user_profile)
        except UserCredentials.DoesNotExist:
            return Response({'error': 'Invalid username or password'}, status=status.HTTP_400_BAD_REQUEST)
        # verifica paswwords
        if check_password(password, user_credentials.password_hash):
            # refresh do token se existir o user
            user_credentials.refresh_token()
            serializer = UserProfileSerializer(user_profile)
            serialized_data = serializer.data
            token = user_profile.usercredentials.token
            print('token login: ', token)
            print('Dados do usuário:', serialized_data)  # Imprime os dados do usuário
            return Response({'message': 'Login successful', 'user': serialized_data, 'token': token}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid username or password'}, status=status.HTTP_400_BAD_REQUEST)
        