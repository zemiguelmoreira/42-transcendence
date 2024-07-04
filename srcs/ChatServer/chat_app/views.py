from django.shortcuts import render
from django.views import View

class Index(View):
    def get(self, request):
        return render(request, 'chat_app/index.html')
    
class Room(View):
    def get(sel, request, room_name):
        return render(request, "chat_app/room.html", {"room_name": room_name})
