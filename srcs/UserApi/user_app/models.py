from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError
import pyotp
import re

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True, default='default.jpg')
    api_image_url = models.URLField(max_length=200, blank=True, null=True, default='')  # Novo campo para armazenar a URL
    userApi42 = models.BooleanField(default=False) # Novo campo para armazenar a se o user é do 42 ou não
    alias_name = models.CharField(blank=True, max_length=20)
    bio = models.TextField(blank=True, max_length=200)
    friend_list = models.JSONField(default=list)
    blocked_list = models.JSONField(default=list)
    is_logged_in = models.BooleanField(default=False)
    two_factor_code = models.CharField(max_length=255, blank=True, null=True)
    two_factor_expiry = models.DateTimeField(blank=True, null=True)
    two_factor_secret = models.CharField(max_length=255, blank=True, null=True)  # Adicione este campo

    # Estatísticas gerais
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)

    # Estatísticas específicas do Pong
    pong_wins = models.IntegerField(default=0)
    pong_losses = models.IntegerField(default=0)
    pong_match_history = models.JSONField(default=list)  # [{'opponent': 'username', 'result': 'win/loss', 'date': 'timestamp'}, ...]
    pong_rank = models.IntegerField(default=0)  # Rank do usuário no Pong

    # Estatísticas específicas do Snake
    snake_wins = models.IntegerField(default=0)
    snake_losses = models.IntegerField(default=0)
    snake_match_history = models.JSONField(default=list)  # [{'opponent': 'username', 'result': 'win/loss', 'date': 'timestamp'}, ...]
    snake_rank = models.IntegerField(default=0)  # Rank do usuário no Snake

    def save(self, *args, **kwargs):
        # Set alias_name to user's username if it's not provided
        if not self.alias_name:
            self.alias_name = self.user.username
        super(UserProfile, self).save(*args, **kwargs)

    # def clean(self):
    #     # Validate alias_name to not allow spaces or special characters
    #     if self.alias_name:
    #         if not re.match(r'^[\w-]+$', self.alias_name):
    #             raise ValidationError("Alias name can only contain letters, numbers, and underscores.")
    #     super(UserProfile, self).clean()

    def generate_2fa_secret(self):
        self.two_factor_secret = pyotp.random_base32()
        self.save()

    def get_2fa_uri(self):
        return pyotp.totp.TOTP(self.two_factor_secret).provisioning_uri(self.user.username, issuer_name="transcendence")

    def is_two_factor_code_valid(self, code):
        totp = pyotp.TOTP(self.two_factor_secret)
        return totp.verify(code)

    def __str__(self):
        return f"Profile of {self.user.username}"
