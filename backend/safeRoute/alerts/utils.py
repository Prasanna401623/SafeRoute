from math import radians, sin, cos, atan2, sqrt
from datetime import datetime
from django.utils import timezone

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in kilometers."""
    R = 6371  # Earth's radius in kilometers
    dlat = radians(lat2-lat1)
    dlon = radians(lon2-lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c

def time_decay(reported_at):
    """
    Compute a decay factor based on time since incident.
    Recent incidents (within 24 hours) have weight 1.0
    Incidents older than 30 days have weight 0.1
    Linear decay between these points
    """
    now = timezone.now()
    if timezone.is_naive(reported_at):
        reported_at = timezone.make_aware(reported_at)
    
    delta_hours = (now - reported_at).total_seconds() / 3600
    
    if delta_hours <= 24:  # Within 24 hours
        return 1.0
    elif delta_hours >= 720:  # 30 days
        return 0.1
    else:
        # Linear decay between 24 hours and 30 days
        return 1.0 - (0.9 * (delta_hours - 24) / (720 - 24))

def determine_severity_from_data(text):
    """
    Map keywords in the text to a severity score.
    Higher numbers indicate more severe incidents.
    """ 
    mapping = {
        'rape': 5,
        'assault': 4,
        'robbery': 4,
        'burglary': 3,
        'theft': 2,
        'suspicious': 1,
        'disturbance': 1
    }
    text_lower = text.lower()
    severity = None
    for keyword, score in mapping.items():
        if keyword in text_lower:
            if severity is None or score > severity:
                severity = score
                
    return severity if severity is not None else 1

def compute_risk_score(incidents, user_lat, user_lon, radius_km=1.0):
    """
    Compute risk score based on:
    1. Distance from incidents (closer = higher risk)
    2. Time since incidents (more recent = higher risk)
    3. Severity of incidents
    
    Risk score is normalized to be between 0 and 10
    """
    total_score = 0.0
    max_incident_score = 0.0  # Track highest individual incident score
    
    for incident in incidents:
        distance = calculate_distance(user_lat, user_lon, incident.latitude, incident.longitude)
        
        if distance <= radius_km:
            # Distance factor: sharp exponential decay with distance
            # 1.0 at distance=0, practically 0 beyond 100m
            distance_factor = pow(0.001, (distance * 1000) / 100)  # Convert km to m
            
            # Time decay factor: 1.0 for recent, down to 0.1 for old
            time_factor = time_decay(incident.reported_at)
            
            # Severity: normalized to 0-1 range (assuming max severity is 5)
            severity = incident.severity if incident.severity else determine_severity_from_data(incident.description)
            severity_factor = severity / 5.0
            
            # Combine factors
            incident_score = distance_factor * time_factor * severity_factor
            
            # Track highest individual incident score
            max_incident_score = max(max_incident_score, incident_score)
            
            # Add to total
            total_score += incident_score
    
    # Final score is 70% based on highest individual incident and 30% on total
    final_score = (0.7 * max_incident_score + 0.3 * (total_score / 3)) * 10.0
    
    # Ensure score is between 0 and 10
    return min(10.0, max(0.0, final_score))

def ai_predict_risk(features):
    """
    Predict risk category based on normalized risk score (0-10):
    0-2.5: D (Safe)
    2.5-5: C (Low Risk)
    5-7.5: B (Moderate Risk)
    7.5-10: A (High Risk)
    """
    risk_score = features.get("risk_score", 0)
    if risk_score < 2.5:
        return "D"
    elif risk_score < 5:
        return "C"
    elif risk_score < 7.5:
        return "B"
    else:
        return "A"