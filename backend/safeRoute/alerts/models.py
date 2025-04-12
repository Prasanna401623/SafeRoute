from django.db import models

class CrimeIncident(models.Model):
    latitude = models.FloatField()
    longitude = models.FloatField()
    description = models.TextField()
    reported_at = models.DateTimeField()
    severity = models.IntegerField(default = 1)
    
    def __str__(self):
        return f"Crime at ({self.latitude}, {self.longitude})-{self.description}"
  
class RiskArea(models.Model):
    latitude = models.FloatField()
    longitude = models.FloatField()
    risk_score = models.FloatField()
    risk_category = models.CharField(max_length = 1)
    computed_at = models.DateTimeField(auto_now = True)
    
    def __str__(self):
        return f"RiskArea at ({self.latitude}, {self.longitude}): {self.risk_category}"
      
