from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    friend_list = models.ManyToManyField(User, related_name='friends')
    blocked_list = models.ManyToManyField(User, related_name='blocked')
    is_logged_in = models.BooleanField(default=False)

    def __str__(self):
        return f"Profile of {self.user.username}"