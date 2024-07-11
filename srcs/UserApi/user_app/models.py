from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import pyotp

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    alias_name = models.TextField(blank=True)
    bio = models.TextField(blank=True)
    friend_list = models.JSONField(default=list)
    blocked_list = models.JSONField(default=list)
    is_logged_in = models.BooleanField(default=False)
    two_factor_code = models.CharField(max_length=255, blank=True, null=True)
    two_factor_expiry = models.DateTimeField(blank=True, null=True)
    two_factor_secret = models.CharField(max_length=255, blank=True, null=True)  # Adicione este campo

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
