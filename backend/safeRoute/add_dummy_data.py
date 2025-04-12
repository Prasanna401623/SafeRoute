import os
import django
from datetime import datetime, timedelta

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safeRoute.settings')
django.setup()

from alerts.models import CrimeIncident

# ULM Library coordinates
ULM_LIBRARY_LAT = 32.5293
ULM_LIBRARY_LON = -92.0745

# Schulze Dining coordinates
SCHULZE_LAT = 32.5285
SCHULZE_LON = -92.0739

# Clear existing data
CrimeIncident.objects.all().delete()

# Add dummy incidents
incidents = [
    # High-risk area near library
    {
        'latitude': ULM_LIBRARY_LAT,
        'longitude': ULM_LIBRARY_LON,
        'description': 'Suspicious activity reported',
        'reported_at': datetime.now() - timedelta(days=1),
        'severity': 4
    },
    {
        'latitude': ULM_LIBRARY_LAT + 0.0002,
        'longitude': ULM_LIBRARY_LON + 0.0002,
        'description': 'Theft incident',
        'reported_at': datetime.now() - timedelta(hours=12),
        'severity': 3
    },
    # Safe area near Schulze
    {
        'latitude': SCHULZE_LAT,
        'longitude': SCHULZE_LON,
        'description': 'Minor disturbance',
        'reported_at': datetime.now() - timedelta(days=5),
        'severity': 1
    }
]

# Create incidents
for incident in incidents:
    CrimeIncident.objects.create(**incident)

print("Added dummy incidents successfully!") 