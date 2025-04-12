from django.urls import path
from .views import RiskAreaAPIView

urlpatterns = [
    path('risk/',RiskAreaAPIView.as_view(), name = 'risk_area'),
    
]