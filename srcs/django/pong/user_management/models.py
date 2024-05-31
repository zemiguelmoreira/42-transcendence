from django.db import models
from django.utils import timezone
from django.contrib.postgres.fields import ArrayField
# from .utils import generate_token # não usar dá circular error

class UserProfile(models.Model):
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True)
    # first_name = models.CharField(max_length=50)
    # last_name = models.CharField(max_length=50)
    email = models.EmailField(max_length=100, unique=True)
    photo_path = models.CharField(max_length=200, blank=True, null=True)
    friendList = ArrayField(models.TextField(), blank=True, default=list,)
    blockList = ArrayField(models.TextField(), blank=True, default=list,)

    def __str__(self):
        return self.username

class UserCredentials(models.Model):
    user = models.OneToOneField(UserProfile, on_delete=models.CASCADE, primary_key=True)
    # username = models.CharField(max_length=50, unique=True)
    password_hash = models.CharField(max_length=200)
    token = models.CharField(max_length=255, unique=True)
    # data_criacao = models.DateTimeField(auto_now_add=True)
    data_criacao = models.DateTimeField(default=timezone.now)
    data_expiracao = models.DateTimeField()

    def __str__(self):
        return self.username
    
    def save(self, *args, **kwargs):
        from .utils import generate_token
        if not self.token or not self.data_expiracao:
            self.token, self.data_expiracao = generate_token(self.user)
        super().save(*args, **kwargs)
    
    def refresh_token(self):
        from .utils import generate_token
        self.token, self.data_expiracao = generate_token(self.user)
        self.save()