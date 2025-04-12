from django.urls import path
from .views import RiskAreaAPIView, ReportCrimeAPIView

urlpatterns = [
    path('risk/', RiskAreaAPIView.as_view(), name='risk_area'),
    path('report_crime/', ReportCrimeAPIView.as_view(), name='report_crime'),
]