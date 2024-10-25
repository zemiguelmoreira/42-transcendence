from django.db import models
from django.contrib.auth import get_user_model

# Create your models here.
User = get_user_model()

class Room(models.Model):
    code = models.CharField(max_length=10, unique=True)
    created_by = models.CharField(max_length=8, blank=True, null=True)
    authorized_user = models.CharField(max_length=8, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    ranked = models.BooleanField(default=False)

    def __str__(self):
        return self.code
