from django.utils import timezone
from datetime import timedelta
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework import generics, mixins, status
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import UserProfile
from .serializers import UserSerializer, UserProfileSerializer

import os
import logging
import qrcode
import qrcode.image.svg
import pyotp
import random
import string
from django.core.mail import send_mail
from smtplib import SMTPException

from django.core.cache import cache
from io import BytesIO

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

### 2FA helpers

def generate_random_code(length=6):
    return ''.join(random.choices(string.digits, k=length))

def send_registration_code(email):
    code = generate_random_code()
    cache.set(f'registration_code_{email}', code, timeout=600)  # Armazena o código no cache por 10 minutos

    try:
        send_mail(
            'Register confirmation - Transcendence',
            f'Your confirmation code is {code}',
            'transcendence42@gmx.com',
            [email],
            fail_silently=False,
        )
    except SMTPException as e:
        logging.error(f"SMTP error occurred: {e}")
        raise

class ConfirmRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logger.info(f'request: {request}')
        email = request.data.get('email')
        code = request.data.get('code')

        if not email or not code:
            return Response({"detail": "Email and code are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Obter o código de confirmação do cache
        cached_code = cache.get(f'registration_code_{email}')

        if cached_code and cached_code == code:
            try:
                user = User.objects.get(email=email)
                user.is_active = True
                user.save()
                cache.delete(f'registration_code_{email}')  # Limpar o código do cache
                return Response({"detail": "Registration confirmed successfully"}, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"detail": "Invalid or expired confirmation code"}, status=status.HTTP_400_BAD_REQUEST)

### Views de Criação e Atualização de Usuário

class CreateUserView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))  # Gera um código aleatório
        
        # Armazena os dados temporariamente no cache
        cache.set(f'registration_data_{email}', serializer.validated_data, timeout=3600)  # Armazena por 1 hora
        cache.set(f'registration_code_{email}', code, timeout=3600)

        # Envia o e-mail com o código
        send_mail(
            'Your Confirmation Code',
            f'Your confirmation code is: {code}',
            'transcendence42@gmx.com',
            [email],
            fail_silently=False,
        )

        return Response({"detail": "Registration data received. Please check your email for the confirmation code."}, status=status.HTTP_200_OK)

class ConfirmRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')

        if not email or not code:
            return Response({"detail": "Email and code are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Verifica o código de confirmação do cache
        cached_code = cache.get(f'registration_code_{email}')
        cached_data = cache.get(f'registration_data_{email}')

        if cached_code == code and cached_data:
            # Cria o usuário com os dados armazenados
            serializer = UserSerializer(data=cached_data)
            if serializer.is_valid():
                user = serializer.save()
                user.is_active = True  # Ativa o usuário após a confirmação
                user.save()
                UserProfile.objects.create(user=user).generate_2fa_secret()
                
                # Limpa os dados do cache
                cache.delete(f'registration_code_{email}')
                cache.delete(f'registration_data_{email}')

                return Response({"detail": "Registration confirmed and user activated successfully."}, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"detail": "Invalid or expired confirmation code"}, status=status.HTTP_400_BAD_REQUEST)

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



