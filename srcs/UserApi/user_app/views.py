from django.utils import timezone
from datetime import timedelta
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework import generics, mixins, status
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.views import TokenViewBase, TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from .models import UserProfile
from .serializers import UserSerializer, UserProfileSerializer
from requests import post, get # para a a Api da 42
from django.http import JsonResponse

import os
from django.conf import settings
import logging
import qrcode
import qrcode.image.svg
import pyotp
import random
import string
from django.core.mail import send_mail
from smtplib import SMTPException
import base64
# import cairosvg
from django.core.cache import cache
from io import BytesIO

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

### 2FA helpers

# def generate_random_code(length=6):
#     return ''.join(random.choices(string.digits, k=length))

# def send_2fa_code(user):
#     code = generate_random_code()
#     user.profile.two_factor_code = code
#     user.profile.two_factor_expiry = timezone.now() + timedelta(minutes=10)
#     user.profile.save()
#     send_mail(
#         'Your 2FA code',
#         f'Your 2FA code is {code}',
#         'transcendence42@gmx.com',
#         [user.email],
#         fail_silently=False,
#     )

### Views de Criação e Atualização de Usuário

# class CreateUserView(generics.CreateAPIView):
#     permission_classes = [AllowAny]
#     queryset = User.objects.all()
#     serializer_class = UserSerializer

#     def perform_create(self, serializer):
#         user = serializer.save()
#         UserProfile.objects.create(user=user).generate_2fa_secret()

#     def create(self, request, *args, **kwargs):
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=False)

#         if not serializer.is_valid():
#             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#         self.perform_create(serializer)
#         headers = self.get_success_headers(serializer.data)
#         return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

# SignIn Api da 42
class FortyTwoConnectView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        # client_secret = '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'
        client_secret = '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'
        # Extrai o código e o state do corpo da requisição
        code = request.data.get('code')
        state = request.data.get('state')
        clientId = request.data.get('clientId')

        logger.info(f'valor do code: {code}')
        logger.info(f'valor do state: {state}')
        logger.info(f'valor do clientId: {clientId}')
        
        # Faz a requisição para trocar o código pelo token de acesso
        response = post('https://api.intra.42.fr/oauth/token', data={
            'grant_type': 'authorization_code',
            'client_id': clientId,
            'client_secret': client_secret,
            'code': code,
            'redirect_uri': 'https://localhost/callback',
        })

        data = response.json()
        logger.info(f'data: {data}')
        
        if 'access_token' in data:
            access_token = data['access_token']
            
            logger.info(f'valor do access_token: {access_token}')

            # Usa o token para obter informações do usuário
            user_response = get('https://api.intra.42.fr/v2/me', headers={'Authorization': f'Bearer {access_token}',})
            user_data = user_response.json()

            logger.info(f'user: {user_data}')
            logger.info(f"user: {user_data['login']}")
            logger.info(f"user: {user_data['email']}")
            logger.info(f"user: {user_data['image']['link']}")      

            data = {
                'username': user_data['login'],
                'email': user_data['email'],
                'api_image_url': user_data['image']['link']
            }

            # Verifica se o username já existe
            if User.objects.filter(username=data['username']).exists():
                user_test = User.objects.get(username=data['username'])
                logger.info(f"user-data: {user_test}")
                try:
                  user_profile = UserProfile.objects.get(user=user_test)
                  logger.info(f'Usuário data: {user_profile.__dict__}')
                except UserProfile.DoesNotExist:
                  return Response({"detail": "UserProfile not found for this user."}, status=status.HTTP_400_BAD_REQUEST)
                # Verificar o valor de user_42 no UserProfile
                if hasattr(user_profile, 'userApi42') and not user_profile.userApi42:
                    return Response({"detail": "This username is already in use."}, status=status.HTTP_400_BAD_REQUEST)
                    
        
            # Verifica se o email já existe (caso o email seja obrigatório ou esteja presente)
            if data['email'] and User.objects.filter(email=data['email']).exists():
                user_test = User.objects.get(email=data['email'])
                logger.info(f"user-data: {user_test}")
                try:
                  user_profile = UserProfile.objects.get(user=user_test)
                  logger.info(f'Usuário data: {user_profile.__dict__}')
                except UserProfile.DoesNotExist:
                  return Response({"detail": "UserProfile not found for this user."}, status=status.HTTP_400_BAD_REQUEST)
                # Verificar o valor de user_42 no UserProfile
                if hasattr(user_profile, 'userApi42') and not user_profile.userApi42:
                    return Response({"detail": "This email is already in use."}, status=status.HTTP_400_BAD_REQUEST)



            user, created = User.objects.get_or_create(
            username=data['username'],
            defaults={
                'email': data['email'],
            })

            if created:
                user.is_active = True
                user.save()

            user_profile, profile_created = UserProfile.objects.update_or_create(
            user=user,  # Relaciona o perfil ao usuário criado/atualizado
            defaults={
                'api_image_url': data['api_image_url'],
                'userApi42': True,
            })

            # Esta linha só define a URL na instância do objeto, não no banco de dados
            # setattr(user_profile, 'api_image_url', data['api_image_url'])
            user_profile.save()

            # Retorna os dados do usuário ou outra resposta desejada
            # return Response({'message': 'Logged in successfully', 'user_data': user_data})
            serializer = UserProfileSerializer(user_profile, context={'request': request})

            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            logger.info(f"user-data: {serializer.data}")
            return Response({
            'user': data,
            'profile': serializer.data,
            'refresh': str(refresh),
            'access': access_token,
            }, status=status.HTTP_200_OK)

        else:
            # return Response({'detail': 'Error logging in'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'detail': 'Error logging in'}, status=status.HTTP_404_NOT_FOUND) # erro alterado por causa do front


class CreateUserView(generics.GenericAPIView):
    permission_classes = [AllowAny]  # Allow any user to access this view.
    serializer_class = UserSerializer  # Specify the serializer for user data validation.

    def post(self, request, *args, **kwargs):
        """
        POST method for user registration.
        
        Receives user data, validates it, generates a confirmation code, stores data in the cache, 
        and sends an email with the confirmation code.
        
        @param request: The HTTP request containing user data (email, username, password, etc.)
        @param args: Additional positional arguments.
        @param kwargs: Additional keyword arguments.
        @return: A Response indicating whether the registration data was successfully received.
        """
        logger.info(f'Request CreateUserView {self.request}')
        # Bind the request data to the serializer and validate it.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)  # Raise an exception if validation fails.

        email = serializer.validated_data['email']  # Extract the validated email.
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))  # Generate a random 6-character confirmation code.

        # Cache the validated user data and the confirmation code for 1 hour.
        cache.set(f'registration_data_{email}', serializer.validated_data, timeout=3600)
        cache.set(f'registration_code_{email}', code, timeout=3600)

        # Send an email with the confirmation code to the user.
        try:
            send_mail(
                'Your Confirmation Code',  # Email subject.
                f'Your confirmation code is: {code}',  # Email body containing the confirmation code.
                os.getenv('EMAIL_HOST_USER'),  # Sender's email address.
                [email],  # Recipient's email address.
                fail_silently=False,  # Raise an error if the email fails to send.
            )
            return Response({"detail": "Registration data received. Please check your email for the confirmation code."}, status=status.HTTP_200_OK)

        except SMTPException as e:
            # Aqui você pode logar o erro ou tomar uma ação apropriada
            logger.info(f'Erro ao enviar email: {e}')
            # return Response({"error": f"Erro ao enviar email: {str(e)}"}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            return Response({"email": ["Error sending the registration code. Please check the email address."]}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        # Return a success response indicating the code was sent to the user's email.
        
        except Exception as e:
        # Usando 400 para erros gerais no processamento da solicitação
            logger.info(f'Erro ao criar user: {e}')
            return Response(
                {"non_field_errors": [f"Error processing the request: {str(e)}"]},
                status=status.HTTP_400_BAD_REQUEST
            )


class ConfirmRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]  # Allow any user to access this view.

    def post(self, request):
        email = request.data.get('email')  # Get the email from the request data.
        code = request.data.get('code')  # Get the confirmation code from the request data.

        # Verifica se o email e o código foram fornecidos
        if not email or not code:
            return Response({"error": {"code": "missing_data", "message": "Email e código são obrigatórios."}}, status=status.HTTP_400_BAD_REQUEST)

        # Verifica se o usuário já está registrado
        if User.objects.filter(email=email).exists():
            return Response({"error": {"code": "user_exists", "message": "Usuário já está registrado."}}, status=status.HTTP_400_BAD_REQUEST)

        # Recupera o código de confirmação e os dados de registro armazenados em cache
        cached_code = cache.get(f'registration_code_{email}')
        cached_data = cache.get(f'registration_data_{email}')

        # Verifica se o código fornecido coincide com o armazenado no cache e se os dados estão presentes
        if cached_code == code and cached_data:
            try:
                # Valida os dados em cache e cria um novo usuário se forem válidos
                serializer = UserSerializer(data=cached_data)
                if serializer.is_valid():
                    user = serializer.save()  # Chama o método que salva o objeto e realiza outras ações necessárias

                    user.is_active = True  # Ativa a conta do usuário
                    user.save()  # Salva as alterações no banco de dados

                    # Cria o perfil do usuário e gera o segredo para 2FA
                    UserProfile.objects.create(user=user).generate_2fa_secret()

                    user_data = UserProfile.objects.get(user=user)
                    logger.info(f'Usuário data: {user_data.__dict__}')

                    # Limpa os dados e o código armazenados em cache
                    cache.delete_many([f'registration_code_{user.email}', f'registration_data_{user.email}'])

                    logger.info(f'Usuário registrado e ativado com sucesso: {user.email}')

                    # Gera os cabeçalhos HTTP de sucesso
                    headers = self.get_success_headers(serializer.data)

                    # Retorna a resposta HTTP 201 (Created) com os dados do usuário e os cabeçalhos
                    return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
                    
                else:
                    # Retorna erros de validação, se houver
                    return Response({"error": {"code": "validation_error", "message": serializer.errors}}, status=status.HTTP_400_BAD_REQUEST)

            except Exception as e:
                logger.error(f'Erro ao processar a confirmação de registro para o usuário {email}: {str(e)}')
                return Response({"error": {"code": "server_error", "message": "Erro ao processar a solicitação. Tente novamente mais tarde."}}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Retorna um erro se o código de confirmação for inválido ou expirado
            logger.warning(f'Tentativa de confirmação com código inválido ou expirado para o email: {email}')
            return Response({"error": {"code": "invalid_code", "message": "Código de confirmação inválido ou expirado."}}, status=status.HTTP_400_BAD_REQUEST)




class UserProfileDetailView(generics.RetrieveUpdateAPIView):
    """
    View para o usuário autenticado visualizar e atualizar seu perfil. Verifica se o perfil
    existe, criando-o se necessário.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]


    def get_object(self):
        # Verifica se o perfil existe para o usuário autenticado
        logger.info(f'Request userprofile detail teste: {self.request.user}')
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

    def retrieve(self, request, *args, **kwargs):
        profile = self.get_object()
        user = self.request.user
        user_serializer = UserSerializer(user)
        profile_serializer = self.get_serializer(profile)

        return Response({
            'user': user_serializer.data,
            'profile': profile_serializer.data
        }, status=status.HTTP_200_OK)

class DeleteUserView(generics.DestroyAPIView):
    """
    View para o usuário autenticado deletar sua própria conta.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        user = request.user
        profile = UserProfile.objects.get(user=user)

        # Deletar a imagem de perfil se não for a imagem padrão
        if profile.profile_image and profile.profile_image.name != 'default.jpg':
            image_path = profile.profile_image.path
            if os.path.exists(image_path):
                os.remove(image_path)

        user.delete()
        return Response({'status': 'User deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

### Views de Gestão de Amizades

class AddFriendView(generics.GenericAPIView, mixins.UpdateModelMixin):
    """
    View para o usuário autenticado adicionar um amigo à sua lista de amigos.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def post(self, request, *args, **kwargs):
        friend_username = request.data.get('friend_username')

        if not friend_username:
            return Response({'error': 'Friend username is required'}, status=status.HTTP_400_BAD_REQUEST)

        if friend_username == request.user.username:
            return Response({'error': 'Cannot add yourself as a friend'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            friend_user = User.objects.get(username=friend_username)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)

        profile, created = UserProfile.objects.get_or_create(user=request.user)

        if friend_username not in profile.friend_list:
            profile.friend_list.append(friend_username)
            profile.save()
        return Response({'status': 'friend added'}, status=status.HTTP_200_OK)

class RemoveFriendView(generics.GenericAPIView, mixins.UpdateModelMixin):
    """
    View para o usuário autenticado remover um amigo da sua lista de amigos.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def post(self, request, *args, **kwargs):
        friend_username = request.data.get('friend_username')
        if not friend_username:
            return Response({'error': 'Friend username is required'}, status=status.HTTP_400_BAD_REQUEST)

        profile, created = UserProfile.objects.get_or_create(user=request.user)

        if friend_username in profile.friend_list:
            profile.friend_list.remove(friend_username)
            profile.save()
            return Response({'status': 'friend removed'}, status=status.HTTP_200_OK)
        return Response({'error': 'Friend not found in friend list'}, status=status.HTTP_404_NOT_FOUND)

class FriendListView(generics.GenericAPIView):
    """
    View para obter a lista de amigos do usuário autenticado com o username e o status de login.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Obter o perfil do usuário autenticado
        user_profile = UserProfile.objects.get(user=request.user)

        # Lista de usernames dos amigos
        friend_usernames = user_profile.friend_list

        # Obter os perfis dos amigos
        friends_profiles = UserProfile.objects.filter(user__username__in=friend_usernames).select_related('user')

        # Construir a resposta
        response_data = [
            {
                'username': profile.user.username,
                'is_logged_in': profile.is_logged_in
            }
            for profile in friends_profiles
        ]

        return Response({'friends': response_data}, status=status.HTTP_200_OK)

### Views de Gestão de Bloqueios

class BlockUserView(generics.GenericAPIView, mixins.UpdateModelMixin):
    """
    View para o usuário autenticado bloquear outro usuário.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def post(self, request, *args, **kwargs):
        blocked_username = request.data.get('blocked_username')
        if not blocked_username:
            return Response({'error': 'Blocked username is required'}, status=status.HTTP_400_BAD_REQUEST)

        if blocked_username == request.user.username:
            return Response({'error': 'Cannot block yourself'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            blocked_user = User.objects.get(username=blocked_username)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)

        profile, created = UserProfile.objects.get_or_create(user=request.user)

        if blocked_username not in profile.blocked_list:
            profile.blocked_list.append(blocked_username)
            profile.save()
        return Response({'status': 'user blocked'}, status=status.HTTP_200_OK)

class UnblockUserView(generics.GenericAPIView, mixins.UpdateModelMixin):
    """
    View para o usuário autenticado desbloquear outro usuário.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def post(self, request, *args, **kwargs):
        blocked_username = request.data.get('blocked_username')
        if not blocked_username:
            return Response({'error': 'Blocked username is required'}, status=status.HTTP_400_BAD_REQUEST)

        profile, created = UserProfile.objects.get_or_create(user=request.user)

        if blocked_username in profile.blocked_list:
            profile.blocked_list.remove(blocked_username)
            profile.save()
            return Response({'status': 'user unblocked'}, status=status.HTTP_200_OK)
        return Response({'error': 'User not found in blocked list'}, status=status.HTTP_404_NOT_FOUND)

class GetBlockedListView(APIView):
    """
    View para o usuário autenticado obter sua lista de bloqueios.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Obtém o perfil do usuário autenticado
        try:
            profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)

        # Retorna a lista de bloqueios
        return Response({'blocked_list': profile.blocked_list}, status=status.HTTP_200_OK)

### Outras Views

class ListAllUsersView(generics.RetrieveUpdateAPIView):
    """
    View para listar todos os perfis de usuários. Disponível apenas para administradores.
    """
    permission_classes = [IsAdminUser]
    serializer = UserProfileSerializer

    def get(self, request):
        profiles = UserProfile.objects.all()
        serializer = UserProfileSerializer(profiles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class GetUserProfileView(generics.RetrieveAPIView):
    """
    View para obter o perfil de um usuário específico com base no nome de usuário. Disponível
    para usuários autenticados.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get(self, request, *args, **kwargs):
        username = request.query_params.get('username')

        if not username:
            return Response({'error': 'Username parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(username=username)
            profile, created = UserProfile.objects.get_or_create(user=user)
            profile_serializer = self.serializer_class(profile, context={'request': request})
            user_serializer = UserSerializer(user)
            return Response({
                'user': user_serializer.data,
                'profile': profile_serializer.data
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class GetUserUsernameView(generics.RetrieveAPIView):
    """
    View para obter o username de um usuário específico com base no id disponível
    para usuários autenticados.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get(self, request, *args, **kwargs):
        user_id = self.request.query_params.get('id', None)

        if not user_id:
            return Response({'error': 'id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
            serializer = self.serializer_class(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class UpdateUserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, format=None):
        user_profile = UserProfile.objects.get(user=request.user)
        serializer = UserProfileSerializer(user_profile, data=request.data, partial=True, context={'request': request})

        logger.info(f'UpdateUserProfileView request data: {request.data}')

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = TokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        user = serializer.user
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)  # Criar o perfil se não existir

        # Aqui você deve gerar um código TOTP secreto para o usuário, se ainda não existir
        if not profile.two_factor_code:
            profile.two_factor_code = pyotp.random_base32()
            profile.save()

        # Gerar tokens JWT
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        return Response({
            'refresh': str(refresh),
            'access': access_token,
        }, status=status.HTTP_200_OK)

class GetQRCodeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        profile = user.profile
        if not profile.two_factor_secret:
            profile.generate_2fa_secret()

        uri = profile.get_2fa_uri()
        img = qrcode.make(uri, image_factory=qrcode.image.svg.SvgImage)
        buffer = BytesIO()
        img.save(buffer)
        svg_img = buffer.getvalue().decode('utf-8')
        svg_img = svg_img.replace('svg:', '')

        return Response({"svg": svg_img}, status=status.HTTP_200_OK)

class Verify2FACodeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        code = request.data.get('code')

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user.profile.is_two_factor_code_valid(code):
            refresh = RefreshToken.for_user(user)
            user.profile.two_factor_code = None
            user.profile.two_factor_expiry = None
            user.profile.save()
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        else:
            return Response({"detail": "Invalid or expired 2FA code"}, status=status.HTTP_400_BAD_REQUEST)

class UpdateMatchHistoryView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data
        logger.info(f'request data :  {data}')
        try:
            current_user = self.request.user
            current_profile = UserProfile.objects.get(user=current_user)

            game_type = data.get('game_type')  # "snake" or "pong"
            user1 = data.get('winner')
            user2 = data.get('loser')
            user1_score = data.get('winner_score')
            user2_score = data.get('loser_score')

            match_data = {
                'timestamp': data.get('timestamp'),
                'winner': user1,
                'winner_score': user1_score,
                'loser': user2,
                'loser_score': user2_score,
            }

            if game_type == "pong":
                current_profile.pong_match_history.append(match_data)

                if current_user.username == user1:
                    current_profile.pong_wins += 1
                    current_profile.wins += 1
                else:
                    current_profile.pong_losses += 1
                    current_profile.losses += 1

                if current_profile.pong_wins % 2 == 0:
                    current_profile.pong_rank += 1
            else:
                current_profile.snake_match_history.append(match_data)

                if current_user.username == user1:
                    current_profile.snake_wins += 1
                    current_profile.wins += 1
                else:
                    current_profile.snake_losses += 1
                    current_profile.losses += 1

                if current_profile.pong_wins % 2 == 0:
                    current_profile.pong_rank += 1

            current_profile.save()

            return Response({'status': 'success'}, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PongRankingListView(APIView):
    """
    View para obter a lista de usuários baseada no ranking de Pong.
    Retorna o username e o valor do pong_rank.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Obter todos os perfis de usuários ordenados pelo pong_rank
        pong_rankings = UserProfile.objects.order_by('-pong_rank').select_related('user')

        # Construindo a resposta com base nos dados
        response_data = [
            {
                'username': profile.user.username,  # Acessando o username diretamente do relacionamento
                'pong_rank': profile.pong_rank,
                'profile_image_url': profile.profile_image.url if profile.profile_image else None  # Acessando a URL da imagem diretamente
            }
            for profile in pong_rankings
        ]

        return Response({'pong_rankings': response_data}, status=status.HTTP_200_OK)


class SnakeRankingListView(APIView):
    """
    View para obter a lista de usuários baseada no ranking de Snake.
    Retorna o username e o valor do snake_rank.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Obter todos os perfis de usuários ordenados pelo snake_rank
        snake_rankings = UserProfile.objects.order_by('-snake_rank').select_related('user')

        # Construindo a resposta com base nos dados
        response_data = [
            {
                'username': profile.user.username,  # Acessando o username diretamente do relacionamento
                'snake_rank': profile.snake_rank,
                'profile_image_url': profile.profile_image.url if profile.profile_image else None  # Acessando a URL da imagem diretamente
            }
            for profile in snake_rankings
        ]

        return Response({'snake_rankings': response_data}, status=status.HTTP_200_OK)



