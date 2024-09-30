from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError
import pyotp
import re


class UserProfile(models.Model):
    """Model representing a user profile, containing additional information beyond the default User model."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    """One-to-one relationship with the User model. Deleting a user also deletes their profile."""
    
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True, default='default.jpg')
    """Field to store the user's profile image. Defaults to 'default.jpg' if no image is uploaded."""
    
    api_image_url = models.URLField(max_length=200, blank=True, null=True, default='')
    """Field to store an external image URL for the user's profile, if applicable."""
    
    userApi42 = models.BooleanField(default=False)
    """Boolean field indicating if the user is linked to the 42 API (a specific external user service)."""
    
    alias_name = models.CharField(blank=True, max_length=20)
    """Field for the user's alias name, which can be displayed in the application."""
    
    bio = models.TextField(blank=True, max_length=200)
    """Field for the user's biography or description, limited to 200 characters."""
    
    friend_list = models.JSONField(default=list)
    """JSON field to store a list of friends associated with the user, initialized to an empty list."""
    
    blocked_list = models.JSONField(default=list)
    """JSON field to store a list of blocked users associated with the user, initialized to an empty list."""
    
    is_logged_in = models.BooleanField(default=False)
    """Boolean field indicating whether the user is currently logged in."""
    
    two_factor_code = models.CharField(max_length=255, blank=True, null=True)
    """Field to store the two-factor authentication (2FA) code for the user, if applicable."""
    
    two_factor_expiry = models.DateTimeField(blank=True, null=True)
    """Field to store the expiration date and time for the 2FA code."""
    
    two_factor_secret = models.CharField(max_length=255, blank=True, null=True)
    """Field to store the secret key for two-factor authentication, used for generating time-based codes."""
    
    # General statistics
    wins = models.IntegerField(default=0)
    """Field to track the total number of wins by the user in games."""
    
    losses = models.IntegerField(default=0)
    """Field to track the total number of losses by the user in games."""
    
    # Pong-specific statistics
    pong_wins = models.IntegerField(default=0)
    """Field to track the total number of wins by the user in Pong."""
    
    pong_losses = models.IntegerField(default=0)
    """Field to track the total number of losses by the user in Pong."""
    
    pong_match_history = models.JSONField(default=list)
    """JSON field to store match history for Pong, recording opponents, results, and timestamps."""
    
    pong_rank = models.IntegerField(default=0)
    """Field to store the user's rank in Pong games."""
    
    # Snake-specific statistics
    snake_wins = models.IntegerField(default=0)
    """Field to track the total number of wins by the user in Snake."""
    
    snake_losses = models.IntegerField(default=0)
    """Field to track the total number of losses by the user in Snake."""
    
    snake_match_history = models.JSONField(default=list)
    """JSON field to store match history for Snake, recording opponents, results, and timestamps."""
    
    snake_rank = models.IntegerField(default=0)
    """Field to store the user's rank in Snake games."""

    def save(self, *args, **kwargs):
        """Override the save method to set alias_name to the user's username if not provided."""
        if not self.alias_name:
            self.alias_name = self.user.username  # Default alias to the username
        super(UserProfile, self).save(*args, **kwargs)  # Call the parent class's save method

    def generate_2fa_secret(self):
        """Generate a random secret for two-factor authentication and save it to the instance."""
        self.two_factor_secret = pyotp.random_base32()  # Generate a base32 secret
        self.save()  # Save the updated user profile

    def get_2fa_uri(self):
        """Get the provisioning URI for the two-factor authentication setup."""
        return pyotp.totp.TOTP(self.two_factor_secret).provisioning_uri(self.user.username, issuer_name="transcendence")
        """Returns a URI for setting up a TOTP app (like Google Authenticator) with the user's username."""

    def is_two_factor_code_valid(self, code):
        """Validate the provided two-factor authentication code against the stored secret."""
        totp = pyotp.TOTP(self.two_factor_secret)  # Create a TOTP object using the stored secret
        return totp.verify(code)  # Verify the provided code against the generated code

    def __str__(self):
        """String representation of the UserProfile instance."""
        return f"Profile of {self.user.username}"  # Returns a user-friendly string for the profile
