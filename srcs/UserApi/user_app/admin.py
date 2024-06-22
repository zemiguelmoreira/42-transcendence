from django.contrib import admin
from .models import UserCredentials, UserProfile

# Register your models here.
admin.site.register(UserProfile)
admin.site.register(UserCredentials)