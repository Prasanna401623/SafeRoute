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

# Initialize risk areas list with dummy data
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
            
            # For now, just return the dummy risk areas
            response_data = {
                "risk_areas": risk_areas,
                "message": "Using dummy data for risk areas"
            }
            
            logger.info(f"Returning dummy risk areas")
            return Response(response_data, status=status.HTTP_200_OK)
            
            # TODO: Uncomment and fix this code when implementing real-time risk calculation
            """
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
            """
            
        except Exception as e:
            logger.error(f"Error processing risk area request: {str(e)}")
            return Response({
                "error": "An error occurred while processing your request."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReportCrimeAPIView(APIView):
    def post(self, request, format=None):
        try:
            logger.info(f"Received crime report: {request.data}")
            
            serializer = CrimeIncidentSerializer(data=request.data)
            if serializer.is_valid():
                incident = serializer.save()
                logger.info(f"Saved crime incident: {incident.id}")
                
                try:
                    user_lat = float(request.data.get("latitude"))
                    user_lon = float(request.data.get("longitude"))
                except (ValueError, TypeError) as e:
                    logger.error(f"Invalid coordinates: {e}")
                    return Response({
                        "error": "Invalid latitude or longitude"
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # For now, use a dummy risk category
                risk_category = 'C'  # Default to medium risk
                
                # Update the risk areas list with the new report
                risk_areas.append({
                    'center': {'latitude': user_lat, 'longitude': user_lon},
                    'radius': 0.2,  # 200 meters
                    'riskLevel': risk_category
                })
                
                response_data = {
                    "crime_report": serializer.data,
                    "risk_area": {
                        "risk_category": risk_category,
                        "message": "Using dummy risk category"
                    }
                }
                
                logger.info(f"Successfully processed report: {response_data}")
                return Response(response_data, status=status.HTTP_201_CREATED)
                
                # TODO: Uncomment and fix this code when implementing real-time risk calculation
                """
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
                logger.info(f"Created risk area: {risk_area.id}")
                
                response_data = {
                    "crime_report": serializer.data,
                    "risk_area": {
                        "risk_area_id": risk_area.id,
                        "risk_score": risk_score,
                        "risk_category": risk_category,
                        "computed_at": risk_area.computed_at,
                    }
                }
                """
            else:
                logger.error(f"Serializer errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error processing crime report: {str(e)}")
            return Response({
                "error": f"An error occurred while processing the report: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MapRiskAreasAPIView(APIView):
    def get(self, request, format=None):
        try:
            # Get map bounds from query parameters
            ne_lat = float(request.query_params.get('ne_lat', 0))
            ne_lng = float(request.query_params.get('ne_lng', 0))
            sw_lat = float(request.query_params.get('sw_lat', 0))
            sw_lng = float(request.query_params.get('sw_lng', 0))
            
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