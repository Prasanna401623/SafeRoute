from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from alerts.models import CrimeIncident, RiskArea
from .utils import compute_risk_score, ai_predict_risk

class RiskAreaAPIView(APIView):
    def get(self,request, format = None):
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        radius = request.query_params.get('radius',1.0)
        
        if lat is None or lon is None:
            return Response( {
                "error":"Please provide 'lat' and 'lon' query parameters."
            },
            status = status.HTTP_400_BAD_REQUEST
                            )
        try:
            user_lat = float(lat)
            user_lon = float(lon)
            radius_km = float(radius)
        except ValueError:
            return Response (
                {
                   "error": "'lat','lon', and 'radius' must be numeric." 
                },
                status = status.HTTP_400_BAD_REQUEST
                
            )
        
        incidents = CrimeIncident.objects.all()
        
        risk_score = compute_risk_score(incidents, user_lat, user_lon, radius_km)
        features = {"risk_score": risk_score}
        
        risk_category = ai_predict_risk(features)
        
        risk_area = RiskArea.objects.create(
            
            latitude = user_lat,
            longitude = user_lon,
            risk_score = risk_score,
            risk_category = risk_category,
        )  
        
        return Response({
            "risk_area_id": risk_area.id,
            "risk_score":risk_score,
            "risk_category": risk_category,
            "computed_at": risk_area.computed_at,
            
        }, status = status.HTTP_200_OK
        ) 