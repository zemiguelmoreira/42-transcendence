from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_logged_in')  # Campos que serão exibidos na lista de UserProfile
    list_filter = ('is_logged_in',)  # Opções de filtro na lateral
    search_fields = ('user__username',)  # Campos que podem ser pesquisados

    # Exemplo de personalização de campos ManyToMany
    filter_horizontal = ('friend_list', 'blocked_list')  # Exibe como uma caixa de seleção horizontal

