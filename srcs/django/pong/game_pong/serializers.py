
# serializers.py
from rest_framework import serializers
from .models import PongMatch

class PongMatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = PongMatch
        fields = ['id', 'winner', 'looser', 'score_winner', 'score_looser', 'date']