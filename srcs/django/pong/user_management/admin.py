from django.contrib import admin
from .models import CustomUser, UserCredentials

# Register your models here.

admin.site.register(CustomUser)
admin.site.register(UserCredentials)