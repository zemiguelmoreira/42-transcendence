from django.db import models
from django.contrib.postgres.fields import ArrayField

class UserProfile(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(max_length=100, unique=True)
    photo_path = models.CharField(max_length=200, blank=True, null=True)
    friendList = ArrayField(models.TextField(), blank=True, default=list,)
    blockList = ArrayField(models.TextField(), blank=True, default=list,)

    def __str__(self):
        return self.username

class UserCredentials(models.Model):
    user = models.OneToOneField(UserProfile, on_delete=models.CASCADE, primary_key=True)
    password_hash = models.CharField(max_length=200)
   
    def __str__(self):
        return self.user.username