from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Match

class MatchSerializer(serializers.ModelSerializer):
    winner = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    loser = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = Match
        fields = ['id', 'winner', 'loser', 'winner_score', 'loser_score', 'game', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        if data['winner'] == data['loser']:
            raise serializers.ValidationError("Winner can't be the same as loser.")
        return data
