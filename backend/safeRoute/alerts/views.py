from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from alerts.models import CrimeIncident, RiskArea
from .utils import compute_risk_score, ai_predict_risk
from django.utils import timezone
from .serializers import CrimeIncidentSerializer
import logging

logger = logging.getLogger(__name__)

class RiskAreaAPIView(APIView):
    def get(self, request, format=None):
        try:
            # Log incoming request
            logger.info(f"Received risk area request with params: {request.query_params}")
            
            lat = request.query_params.get('lat')
            lon = request.query_params.get('lon')
            radius = request.query_params.get('radius', 1.0)
            
            if lat is None or lon is None:
                return Response({
                    "error": "Please provide 'lat' and 'lon' query parameters."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                user_lat = float(lat)
                user_lon = float(lon)
                radius_km = float(radius)
            except ValueError:
                return Response({
                    "error": "'lat', 'lon', and 'radius' must be numeric."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get all incidents
            incidents = CrimeIncident.objects.all()
            logger.info(f"Found {incidents.count()} incidents in database")
            
            # Compute risk score
            risk_score = compute_risk_score(incidents, user_lat, user_lon, radius_km)
            features = {"risk_score": risk_score}
            
            # Predict risk category
            risk_category = ai_predict_risk(features)
            
            # Create risk area record
            risk_area = RiskArea.objects.create(
                latitude=user_lat,
                longitude=user_lon,
                risk_score=risk_score,
                risk_category=risk_category,
            )
            
            response_data = {
                "risk_area_id": risk_area.id,
                "risk_score": risk_score,
                "risk_category": risk_category,
                "computed_at": risk_area.computed_at,
            }
            
            logger.info(f"Computed risk area: {response_data}")
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error processing risk area request: {str(e)}")
            return Response({
                "error": "An error occurred while processing your request."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReportCrimeAPIView(APIView):
    def post(self, request, format=None):
        serializer = CrimeIncidentSerializer(data=request.data)
        if serializer.is_valid():
            incident = serializer.save()
            
            try:
                user_lat = float(request.data.get("latitude"))
                user_lon = float(request.data.get("longitude"))
            except (ValueError, TypeError):
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            radius_km = 1.0
            incidents = CrimeIncident.objects.all()
            risk_score = compute_risk_score(incidents, user_lat, user_lon, radius_km)
            features = {"risk_score": risk_score}
            risk_category = ai_predict_risk(features)
            
            risk_area = RiskArea.objects.create(
                latitude=user_lat,
                longitude=user_lon,
                risk_score=risk_score,
                risk_category=risk_category,
            )
            
            response_data = {
                "crime_report": serializer.data,
                "risk_area": {
                    "risk_area_id": risk_area.id,
                    "risk_score": risk_score,
                    "risk_category": risk_category,
                    "computed_at": risk_area.computed_at,
                }
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) 