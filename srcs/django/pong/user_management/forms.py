from django import forms
from .models import UserProfile, UserCredentials

class UserProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ['username', 'first_name', 'last_name', 'email', 'photo_path']

class UserCredentialsForm(forms.ModelForm):
    class Meta:
        model = UserCredentials
        fields = ['username', 'password_hash']
