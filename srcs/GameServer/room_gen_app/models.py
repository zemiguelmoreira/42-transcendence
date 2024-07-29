from django.db import models
from django.contrib.auth import get_user_model

# Create your models here.
User = get_user_model()

class Room(models.Model):
    code = models.CharField(max_length=10, unique=True)
    created_by = models.ForeignKey(User, related_name='rooms_created', on_delete=models.CASCADE)
    authorized_user = models.ForeignKey(User, related_name='rooms_authorized', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

