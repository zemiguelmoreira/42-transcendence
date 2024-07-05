from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    friend_list = models.JSONField(default=list)  # Lista de usernames dos amigos
    blocked_list = models.JSONField(default=list)  # Lista de usernames dos bloqueados
    is_logged_in = models.BooleanField(default=False)

    def __str__(self):
        return f"Profile of {self.user.username}"
    

