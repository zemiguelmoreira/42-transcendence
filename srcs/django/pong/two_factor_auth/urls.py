from django.urls import path, include

urlpatterns = [
    path('', include('two_factor.urls', 'two_factor')),
]
