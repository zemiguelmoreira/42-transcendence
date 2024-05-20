from django.shortcuts import render, redirect
from django.http import JsonResponse, Http404, HttpResponseNotFound
from .models import CustomUser, Token, UserCredentials
from django.contrib.auth import authenticate, login
# from django.views.decorators.csrf import csrf_exempt
from .forms import CustomUserForm, LoginForm
from .utils import generate_token, verificar_token_cookie
from django.contrib.auth.hashers import check_password
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.middleware.csrf import get_token
from django.utils import timezone
import logging


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

#Só para teste
data = [
    {
        "name":"Heitor",
        "college":"42porto",
    },
    {
        "name":"Nuno",
        "college":"42porto",
    },
    {
        "name":"Jose",
        "college":"42porto",
    },
]


# Create your views here.
def index(request):
    # return render(request, "index.html")
    return Response(data, safe = False)


def user_list(request):
    users = CustomUser.objects.all()
    users_data = [
        {
            'user_id': user.user_id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'photo_path': user.photo_path,
        }
        for user in users
    ]
    return Response(users_data, safe=False)


def user_detail(request, pk):
    try:
        user = CustomUser.objects.get(pk=pk)
    except CustomUser.DoesNotExist:
        raise Http404("Usuário não encontrado")

    user_data = {
        'user_id': user.user_id,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'photo_path': user.photo_path,
    }
    
    return Response(user_data)

# def check_username(request):
#     if 'username' in request.GET:
#         username_to_find = request.GET['username']
#         try:
#             user = CustomUser.objects.get(username=username_to_find)
#             return render(request, 'result.html', {'user': user})
#         except CustomUser.DoesNotExist: 
#             return HttpResponseNotFound("Usuário não encontrado")
#     else:
#         return render(request, 'index.html')
    


# def register_user(request):
#     if request.method == 'POST':
        # username = request.POST['username']
        # first_name = request.POST['first_name']
        # last_name = request.POST['last_name']
        # email = request.POST['email']
        # password = request.POST['password']
        # confirm_password = request.POST['confirm_password']
        
#         if password == confirm_password:
#             # Create user
#             user = CustomUser.objects.create_user(username=username, email=email, first_name=first_name, last_name=last_name, password=password)
            
#             # Log in the user automatically
#             # login(request, user)
#             # Redirect to the profile page or any other page of your choice
#             # id = user.user_id
#             # return redirect(f'/users/{id}/')
#             return render(request, 'result.html', {'user': user})
#         else:
#             # Passwords don't match, return an error message
#             return render(request, 'register.html', {'error': 'Passwords do not match'})
#     else:
#         return render(request, 'register.html')

# @csrf_exempt #utilizado por causa do crossorigin, 2º opção desligar middleware 

@api_view(['POST'])
def register_user(request):
    # token_key = request.COOKIES.get('session_cookie')
    # logger.info(f'token na cookie: {token_key}')
    if request.method == 'POST':
        form = CustomUserForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            first_name = form.cleaned_data['first_name']
            last_name = form.cleaned_data['last_name']
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']
            confirm_password = form.cleaned_data['confirm_password']
            # print('teste')
            if password == confirm_password:
                # Create user
                user = CustomUser.objects.create_user(username=username, email=email, first_name=first_name, last_name=last_name, password=password)
                # print(user)
                if user is not None:
                    # Usuário criado com sucesso
                    # return render(request, 'result.html', {'user': user})
                    token, exp_time = generate_token(user)
                    logger.info(f'Token gerado para usuário {user.username} {token}')
                    logger.info(f'Token valido até: {exp_time}')
                    Token.objects.create(user=user, token=token, data_expiracao=exp_time)
                    return Response({'status': 'success', 'message': 'Formulário válido!', 'token': token, 'user': username})
                else:
                    # Algo deu errado durante a criação do usuário
                    # return render(request, 'register.html', {'error': 'Something went wrong while creating the user'})
                    return Response({'status': 'error', 'message': 'User not created!'})
            else:
                # Passwords don't match, return an error message
                # return render(request, 'register.html', {'error': 'Passwords do not match'})
                return Response({'status': 'error', 'message': 'Passworsd do not match!'})
        else:
            return Response({'status': 'error', 'errors': form.errors})
    else:
        return Response({'status': 'error', 'message': 'Bad Request'})




# @csrf_exempt

@api_view(['POST'])
def login_user(request):
    verificar_token_cookie(request); # testar com o login
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            user_or_email = form.cleaned_data['user_or_email']
            password = form.cleaned_data['password']
            
            try:
                user = CustomUser.objects.get(username=user_or_email) or CustomUser.objects.get(email=user_or_email)
            except CustomUser.DoesNotExist:
                user = None

            if user:
                user_credentials = UserCredentials.objects.get(user=user)
                if check_password(password, user_credentials.password_hash):
                    token, exp_time = generate_token(user)
                    logger.info(f'Token gerado para usuário {user.username} {token}')
                    logger.info(f'Token valido até: {exp_time}')
                    Token.objects.create(user=user, token=token, data_expiracao=exp_time)
                    return Response({'status': 'success', 'message': 'Formulário válido!', 'token': token, 'user': user})
                    
                else:
                    # Senha incorreta
                    # form.add_error('password', 'Senha incorreta.')
                    return Response({'status': 'error', 'message': 'Passworsd incorret!'})
            else:
                # Usuário não encontrado
                # form.add_error('username_or_email', 'Usuário ou email não encontrado.')
                return Response({'status': 'error', 'message': 'User or email not found!'})
    else:
        # form = LoginForm()
        return Response({'status': 'error', 'message': 'Bad Request'})

    # return render(request, 'login.html', {'form': form})


# a utilizar quando retirarmo o CORS_ALLOW_ALL_ORIGINS = True
# @api_view(['GET'])
# def get_csrf_token(request):
#     csrf_token = get_token(request)
#     response = Response({'csrfToken': csrf_token})
#     response['Access-Control-Allow-Origin'] = 'http://127.0.0.1:5500'
#     response['Access-Control-Allow-Credentials'] = 'true'
#     return response

@api_view(['GET'])
def get_csrf_token(request):
    csrf_token = get_token(request)
    return Response({'csrfToken': csrf_token})

# a utilizar com cookies
def verificar_token(request):
    token_key = request.COOKIES.get('session_cookie')
    logger.info(f'token na cookie: {token_key}')
    
    if token_key:
        try:
            # Verifique se existe um token válido com a chave fornecida
            token = Token.objects.get(token=token_key, data_expiracao__gt=timezone.now())
            user = token.user
            
            # Se o token e o usuário associado existirem e o token não tiver expirado, retorne sucesso
            return JsonResponse({'status': 'success', 'message': 'Token válido', 'user': user.username})
        
        except Token.DoesNotExist:
            # Se o token não for encontrado ou expirou, retorne erro
            return JsonResponse({'status': 'error', 'message': 'Token inválido ou expirado'})
    else:
        # Se a cookie de sessão não for encontrada, retorne erro
        return JsonResponse({'status': 'error', 'message': 'Cookie de sessão não encontrado'})
