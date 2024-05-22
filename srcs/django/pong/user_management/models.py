from django.db import models

class UserProfile(models.Model):
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(max_length=100, unique=True)
    photo_path = models.CharField(max_length=200, blank=True, null=True)

    def __str__(self):
        return self.username

class UserCredentials(models.Model):
    user = models.OneToOneField(UserProfile, on_delete=models.CASCADE, primary_key=True)
    username = models.CharField(max_length=50, unique=True)
    password_hash = models.CharField(max_length=200)

    def __str__(self):
        return self.username


class Token(models.Model):
    user = models.OneToOneField(UserProfile, on_delete=models.CASCADE, primary_key=True)
    token = models.CharField(max_length=255, unique=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_expiracao = models.DateTimeField()

    def __str__(self):
        return self.token