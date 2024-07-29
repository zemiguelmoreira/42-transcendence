from django.contrib import admin
from .models import Room

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['code', 'created_at']
    readonly_fields = ['code', 'created_at']
