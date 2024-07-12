from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'alias_name', 'bio', 'is_logged_in']
    list_filter = ['is_logged_in']
    search_fields = ['user__username', 'alias_name']
    readonly_fields = ['user']  # Defina campos como somente leitura se necessário

    fieldsets = (
        (None, {
            'fields': ('user', 'alias_name', 'bio')
        }),
        ('Lists', {
            'fields': ('friend_list', 'blocked_list')
        }),
        ('Two Factor Authentication', {
            'fields': ('is_logged_in', 'two_factor_code', 'two_factor_expiry', 'two_factor_secret')
        }),
        ('General Stats', {
            'fields': ('wins', 'losses')
        }),
        ('Pong Stats', {
            'fields': ('pong_wins', 'pong_losses', 'pong_rank', 'pong_match_history')
        }),
        ('Snake Stats', {
            'fields': ('snake_wins', 'snake_losses', 'snake_rank', 'snake_match_history')
        }),
    )
