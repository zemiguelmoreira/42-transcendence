from django import forms
from .models import CustomUser

# class CustomUserForm(forms.ModelForm):
    

#     class Meta:
#         model = CustomUser
#         fields = ['username', 'email', 'first_name', 'last_name', 'photo_path']

class CustomUserForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)
    confirm_password = forms.CharField(widget=forms.PasswordInput)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'first_name', 'last_name', 'photo_path', 'password', 'confirm_password']


class LoginForm(forms.Form):
    user_or_email = forms.CharField(max_length=50)
    password = forms.CharField(widget=forms.PasswordInput)