from django.db import models

# Create your models here.
class PongMatch(models.Model):
    id = models.AutoField(primary_key=True)
    winner = models.CharField(max_length=50)
    looser = models.CharField(max_length=50)
    score_winner = models.IntegerField()
    score_looser = models.IntegerField()
    date = models.DateField()

    def __str__(self):
        return f"{self.winner} vs {self.looser} on {self.date}: {self.score_winner} x {self.score_looser}"