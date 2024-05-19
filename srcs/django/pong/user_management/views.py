# from django.shortcuts import render
# from django.http import JsonResponse
# from .forms import UserProfileForm
# from .models import UserProfile
# from django.core.serializers import serialize
# from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt

# Create your views here.

# def profile(request):
#     users = UserProfile.objects.all()
#     user_data = [{'username': user.username, 'first_name': user.first_name, 'last_name': user.last_name, 'email': user.email, 'photo_path': user.photo_path} for user in users]
#     return JsonResponse({'users': user_data})

# @csrf_exempt
# def register_user(request):
#     if request.method == 'POST':
#         form = UserProfileForm(request.POST)
#         if form.is_valid():
#             form.save()
#             return JsonResponse({'message': 'User profile created successfully'}, status=201)
#         else:
#             return JsonResponse({'error': form.errors}, status=400)
#     return JsonResponse({'error': 'Invalid request method'}, status=405)
        
# @ensure_csrf_cookie
# def get_csrf_token(request):
#     csrf_token = get_token(request)
#     return JsonResponse({'csrfToken': csrf_token})

# views.py
from rest_framework.views import APIView
from django.contrib.auth.hashers import check_password
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import UserProfile
from .serializers import UserProfileSerializer
from django.middleware.csrf import get_token
from .models import UserProfile, UserCredentials
from django.contrib.auth.hashers import make_password


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

        # Salvar o usuário e a senha
        user_profile = serializer.save()
        password_hash = make_password(password)
        UserCredentials.objects.create(user=user_profile, username=user_profile.username, password_hash=password_hash)
        
        return Response({'message': 'User profile created successfully'}, status=status.HTTP_201_CREATED)
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
