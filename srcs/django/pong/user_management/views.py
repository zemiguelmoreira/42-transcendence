from django.shortcuts import render
from django.http import JsonResponse
from .forms import UserProfileForm
from .models import UserProfile
from django.core.serializers import serialize
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.middleware.csrf import get_token

# Create your views here.

def profile(request):
    users = UserProfile.objects.all()
    user_data = [{'username': user.username, 'first_name': user.first_name, 'last_name': user.last_name, 'email': user.email, 'photo_path': user.photo_path} for user in users]
    return JsonResponse({'users': user_data})

@csrf_exempt
def register_user(request):
    if request.method == 'POST':
        form = UserProfileForm(request.POST)
        if form.is_valid():
            form.save()
            return JsonResponse({'message': 'User profile created successfully'}, status=201)
        else:
            return JsonResponse({'error': form.errors}, status=400)
    return JsonResponse({'error': 'Invalid request method'}, status=405)
        
@ensure_csrf_cookie
def get_csrf_token(request):
    csrf_token = get_token(request)
    return JsonResponse({'csrfToken': csrf_token})
