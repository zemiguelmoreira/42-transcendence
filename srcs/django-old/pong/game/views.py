# from django.shortcuts import render
from django.middleware.csrf import get_token
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .serializer import KeyPressSerializer
from rest_framework import status

# Create your views here.

@api_view(['POST'])
def singleLocal(request):
    serializer = KeyPressSerializer(data=request.data)
    if serializer.is_valid():
        key_code = serializer.validated_data['keyCode']
        print(f"Key pressed: {key_code}")
        return Response({'message': key_code}, status=status.HTTP_200_OK)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_csrf_token(request):
    csrf_token = get_token(request)
    return Response({'csrfToken': csrf_token})

