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

#para apagar as fotos
import os
from django.conf import settings

import logging

# import random
# import string
# from django.core.mail import send_mail

import base64
import qrcode
import qrcode.image.svg
import pyotp
# import cairosvg
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

class CreateUserView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        UserProfile.objects.create(user=user).generate_2fa_secret()
        
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=False)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


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
