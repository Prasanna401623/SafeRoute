from django.urls import path
from . import views

urlpatterns = [
    path('risk/', views.RiskAreaAPIView.as_view(), name='risk_area'),
    path('report_crime/', views.ReportCrimeAPIView.as_view(), name='report_crime'),
    path('risk_areas/', views.MapRiskAreasAPIView.as_view(), name='map_risk_areas'),
]