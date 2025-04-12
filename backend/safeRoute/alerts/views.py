from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from alerts.models import CrimeIncident, RiskArea
from .utils import compute_risk_score, ai_predict_risk
from django.utils import timezone
from .serializers import CrimeIncidentSerializer
import logging
import math

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

class MapRiskAreasAPIView(APIView):
    def get(self, request, format=None):
        try:
            # Get map bounds from query parameters
            ne_lat = float(request.query_params.get('ne_lat', 0))
            ne_lng = float(request.query_params.get('ne_lng', 0))
            sw_lat = float(request.query_params.get('sw_lat', 0))
            sw_lng = float(request.query_params.get('sw_lng', 0))
            
            # Define risk areas based on dummy data locations
            risk_areas = [
                {
                    'center': {'latitude': 32.5293, 'longitude': -92.0745},  # ULM Library (High Risk)
                    'radius': 0.2,  # 200 meters
                    'riskLevel': 'A'
                },
                {
                    'center': {'latitude': 32.5285, 'longitude': -92.0739},  # Schulze Dining (Low Risk)
                    'radius': 0.2,  # 200 meters
                    'riskLevel': 'C'
                }
            ]
            
            # Convert to response format with circles
            areas = []
            for area in risk_areas:
                lat = area['center']['latitude']
                lng = area['center']['longitude']
                radius_km = area['radius']
                
                # Convert radius from kilometers to degrees
                # At the equator, 1 degree is approximately 111.32 km
                # We'll use this as a rough approximation
                radius_deg = radius_km / 111.32
                
                # Only include areas that are within the map bounds
                if (sw_lat <= lat <= ne_lat and sw_lng <= lng <= ne_lng):
                    # Generate points for a circle
                    points = []
                    for i in range(0, 360, 10):  # Create points every 10 degrees
                        angle = i * (3.14159 / 180)  # Convert to radians
                        # Calculate point on circle using degrees
                        point_lat = lat + (radius_deg * math.cos(angle))
                        point_lng = lng + (radius_deg * math.sin(angle))
                        points.append({'latitude': point_lat, 'longitude': point_lng})
                    
                    areas.append({
                        'coordinates': points,
                        'riskLevel': area['riskLevel'],
                        'center': area['center'],
                        'radius': radius_km
                    })
            
            return Response({'areas': areas}, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting map risk areas: {str(e)}")
            return Response({
                'error': 'An error occurred while fetching risk areas'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 