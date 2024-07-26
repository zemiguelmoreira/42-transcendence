from django.http import JsonResponse
# from django.contrib.auth.decorators import login_required
from .models import UserStatus

# @login_required

def online_users(request):
    try:
        online_statuses = UserStatus.objects.filter(is_online=True)
        users = [status.user.username for status in online_statuses]
        return JsonResponse(users, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
