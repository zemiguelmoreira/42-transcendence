from django.db import models
from django.contrib.auth.hashers import make_password


# class CustomUserManager(models.Manager):
#     def create_user(self, username, email, first_name, last_name, password=None):
#         if not email:
#             raise ValueError('O email é obrigatório')
#         if not username:
#             raise ValueError('O nome de usuário é obrigatório')

#         user = self.model(
#             username=username,
#             email=email,
#             first_name=first_name,
#             last_name=last_name,
#             photo_path = "",
#         )
#         if password:
#             user.password = password
#         user.save(using=self._db)
#         return user

class CustomUserManager(models.Manager):
    def create_user(self, username, email, first_name, last_name, password=None):
        if not email:
            raise ValueError('O email é obrigatório')
        if not username:
            raise ValueError('O nome de usuário é obrigatório')

        user = self.model(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            photo_path="",
        )
        user.save(using=self._db)

        # Criar uma instância de UserCredentials e salvar a senha
        if password:
            UserCredentials.objects.create(
                user=user,
                password_hash=make_password(password)  # Utilize make_password para gerar o hash da senha
            )

        return user


class CustomUser(models.Model):
    user_id = models.BigAutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    photo_path = models.CharField(max_length=200, blank=True) #campo opcional

    objects = CustomUserManager()

    def __str__(self):
        return self.username

class UserCredentials(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
    password_hash = models.CharField(max_length=200)

    def __str__(self):
        return self.user.username


class Token(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    token = models.CharField(max_length=255, unique=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_expiracao = models.DateTimeField()

    def __str__(self):
        return self.token