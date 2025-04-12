from math import radians,sin, cos, atan2, sqrt
from datetime import datetime

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = radians(lat2-lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c= 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c

def time_decay(reported_at):
    """
    Computing  a decay factor (newer incidents get more weight).
    Here, k is a constant (adjustable); the function returns a value between 0 and 1.
    """
    now = datetime.now()
    delta_days = (now-reported_at).days
    k = 30.0
    return 1/(1 + delta_days/k)

def determine_severity_from_data(text):
    """
    mapping keywords in the text to a severity score.
    higher the number , the more severe the incident.
    """ 
    mapping = {
        'rape': 5,
        'domestic violence': 4,
        'assault':4,
        'robbery': 3,
        'burglary': 3,
        'theft': 2,
        
    }
    text_lower = text.lower()
    severity = None
    for keyword,score in mapping.items():
        if keyword in text_lower:
            if severity is None or score > severity:
                severity = score
                
    return severity if severity is not None else 1

def compute_risk_score(incidents,user_lat, user_lon, radius_km = 1.0):
    """
    Compute a cumulative risk score for all incidents within radius_km of the given location.
    Each incident's contributio is (severity*time_decay), where severity is determined
    either from the incident.severity field (if set ) or inferred from its description.
    
    """
    score  = 0.0
    for incident in incidents:
        distance = calculate_distance(user_lat, user_lon, incident.latitude, incident.longitude)
        if distance <= radius_km:
            decay = time_decay(incident.reported_at)
            if incident.severity:
                incident_severity = incident.severity
            else:
                incident_severity = determine_severity_from_data(incident.description)
                
            score += incident_severity *decay
    return score

def ai_predict_risk(features):
    """
    A simple rule-based AI that predicts risk category based on the risk score computed
    """
    risk_score = features.get("risk_score",0)
    if risk_score < 1:
        return "D" 
    elif risk_score < 3:
        return "C"
    elif risk_score < 6:
        return "B"
    else: 
        return "A"