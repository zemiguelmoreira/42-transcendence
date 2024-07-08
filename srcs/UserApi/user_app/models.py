from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    friend_list = models.JSONField(default=list)  # Lista de usernames dos amigos
    blocked_list = models.JSONField(default=list)  # Lista de usernames dos bloqueados
    is_logged_in = models.BooleanField(default=False)
    two_factor_code = models.CharField(max_length=6, blank=True, null=True)
    two_factor_expiry = models.DateTimeField(blank=True, null=True)

    def is_two_factor_code_valid(self, code):
        return self.two_factor_code == code and self.two_factor_expiry > timezone.now()

    def __str__(self):
        return f"Profile of {self.user.username}"
    

