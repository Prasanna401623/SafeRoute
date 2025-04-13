import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import MapView, { Region, Marker, PROVIDER_GOOGLE, Polygon } from 'react-native-maps';
import * as Location from 'expo-location';
import { FontAwesome } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { API_BASE_URL } from '@/constants/config';
import { useIsFocused } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure notifications for foreground only
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const DISTANCE_THRESHOLD = 100; // meters - check only after moving 100 meters
const CHECK_INTERVAL = 15000; // 15 seconds - reduced frequency
const ULM_REGION = {
  latitude: 32.5293, // ULM Library coordinates
  longitude: -92.0745,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

type RiskArea = {
  coordinates: { latitude: number; longitude: number }[];
  riskLevel: string;
  radius: number;
};

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [riskLevel, setRiskLevel] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const lastCheckedLocation = useRef<{ latitude: number; longitude: number } | null>(null);
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const isFocused = useIsFocused();
  const [riskAreas, setRiskAreas] = useState<RiskArea[]>([]);
  const [mapRegion, setMapRegion] = useState<Region>(ULM_REGION);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const lastNotificationTime = useRef(0);

  useEffect(() => {
    const initialize = async () => {
      setIsInitializing(true);
      try {
        await setupLocationUpdates();
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        if (currentLocation) {
          // Don't check risk area on initialization, just set the location
          setLocation(currentLocation);
        }
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        setNotificationPermission(status === 'granted');
      } catch (error) {
        console.warn('Error setting up notifications:', error);
        // Continue without notifications
      }
    };

    setupNotifications();
  }, []);

  const setupLocationUpdates = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      setLocation(currentLocation);
      
      if (!isInitializing) {
        checkRiskArea(currentLocation);
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: DISTANCE_THRESHOLD,
          timeInterval: CHECK_INTERVAL,
        },
        (newLocation) => {
          setLocation(newLocation);
          if (!isInitializing) {
            checkIfShouldUpdateRisk(newLocation);
          }
        }
      );
    } catch (error) {
      console.error('Error:', error);
      setErrorMsg('Error getting location');
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const checkIfShouldUpdateRisk = (newLocation: Location.LocationObject) => {
    if (isSending) return;

    if (!lastCheckedLocation.current) {
      console.log('First location check:', newLocation.coords);
      lastCheckedLocation.current = {
        latitude: newLocation.coords.latitude,
        longitude: newLocation.coords.longitude,
      };
      checkRiskArea(newLocation);
      return;
    }

    const distance = calculateDistance(
      lastCheckedLocation.current.latitude,
      lastCheckedLocation.current.longitude,
      newLocation.coords.latitude,
      newLocation.coords.longitude
    );

    console.log('Distance moved:', distance, 'meters');
    console.log('Current location:', newLocation.coords);
    console.log('Last checked location:', lastCheckedLocation.current);

    if (distance >= DISTANCE_THRESHOLD) {
      console.log('Distance threshold reached, checking risk area');
      lastCheckedLocation.current = {
        latitude: newLocation.coords.latitude,
        longitude: newLocation.coords.longitude,
      };
      checkRiskArea(newLocation);
    }
  };

  const showNotification = async (riskLevel: string) => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      const now = Date.now();
      if (now - lastNotificationTime.current < 60000) { // 60 seconds cooldown
        return;
      }
      lastNotificationTime.current = now;

      const title = riskLevel === 'A' 
        ? "⚠️ High Risk Area Alert" 
        : "⚠️ Moderate Risk Area";
      
      const body = riskLevel === 'A'
        ? "You have entered a high-risk area. Please be extremely cautious."
        : "You have entered a moderate-risk area. Stay alert.";

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  const fetchRiskAreas = async (region: Region) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/risk/?lat=${region.latitude}&lon=${region.longitude}&radius=0.2`
      );
      
      if (!response.ok) throw new Error('Failed to fetch risk areas');
      
      const data = await response.json();
      const riskAreas = data.risk_areas || [];
      
      // Transform the risk areas into circle coordinates
      const transformedAreas = riskAreas.map((area: any) => {
        const points = [];
        const center = area.center;
        const radius = area.radius; // 0.2 km = 200 meters
        
        // Convert radius from kilometers to degrees
        const radiusDeg = radius / 111.32; // 111.32 km per degree at equator
        
        // Generate points for a circle
        for (let i = 0; i < 360; i += 10) {
          const angle = i * (Math.PI / 180);
          const lat = center.latitude + (radiusDeg * Math.cos(angle));
          const lng = center.longitude + (radiusDeg * Math.sin(angle));
          points.push({ latitude: lat, longitude: lng });
        }
        
        return {
          coordinates: points,
          riskLevel: area.riskLevel,
          radius: radius
        };
      });
      
      setRiskAreas(transformedAreas);
    } catch (error) {
      console.error('Error fetching risk areas:', error);
      setErrorMsg('Failed to fetch risk areas');
    }
  };

  useEffect(() => {
    fetchRiskAreas(mapRegion);
  }, [mapRegion]);

  const checkRiskArea = async (currentLocation: Location.LocationObject, isManualCheck: boolean = false) => {
    if (isSending) return;

    try {
      setIsSending(true);
      console.log('Checking risk area for location:', currentLocation.coords);
      const url = `${API_BASE_URL}/risk/?lat=${currentLocation.coords.latitude}&lon=${currentLocation.coords.longitude}&radius=0.2`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const riskAreas = data.risk_areas || [];
      console.log('Received risk areas:', riskAreas);
      
      // Check if current location is inside any risk area
      let currentRiskLevel = "D"; // Default to safe
      let currentRiskScore = 0;
      
      for (const area of riskAreas) {
        const distance = calculateDistance(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
          area.center.latitude,
          area.center.longitude
        );
        
        console.log('Distance to risk area:', distance, 'meters');
        console.log('Risk area radius:', area.radius * 1000, 'meters');
        
        // If within the radius of a risk area, use that risk level
        if (distance <= area.radius * 1000) { // Convert km to meters
          console.log('Inside risk area! Distance:', distance, 'meters');
          currentRiskLevel = area.riskLevel;
          currentRiskScore = area.riskLevel === 'A' ? 0.8 : 
                           area.riskLevel === 'B' ? 0.5 : 
                           area.riskLevel === 'C' ? 0.2 : 0;
          break;
        }
      }
      
      if (currentRiskLevel !== riskLevel) {
        console.log('Risk level changed from', riskLevel, 'to', currentRiskLevel);
        setRiskLevel(currentRiskLevel);
        // Show notification only for high or moderate risk
        if (currentRiskLevel === 'A' || currentRiskLevel === 'B') {
          console.log('Showing notification for risk level:', currentRiskLevel);
          await showNotification(currentRiskLevel);
        }
        Alert.alert(
          'Risk Assessment',
          `Risk Level: ${currentRiskLevel}\nRisk Score: ${currentRiskScore.toFixed(2)}\n\n${getRiskMessage(currentRiskLevel)}`,
          [{ text: 'OK' }]
        );
      } else if (isManualCheck) {
        Alert.alert(
          'Risk Assessment',
          `Risk Level: ${currentRiskLevel}\nRisk Score: ${currentRiskScore.toFixed(2)}\n\n${getRiskMessage(currentRiskLevel)}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error checking risk area:', error);
      if (isManualCheck) {
        setErrorMsg('Unable to check risk level. Please try again.');
      }
    } finally {
      setIsSending(false);
    }
  };

  const getRiskMessage = (category: string) => {
    switch (category) {
      case 'A':
        return 'This is a high-risk area. Please be extremely cautious and aware of your surroundings.';
      case 'B':
        return 'This is a moderate-risk area. Stay alert and take necessary precautions.';
      case 'C':
        return 'This is a low-risk area. Exercise normal caution.';
      case 'D':
        return 'This is a safe area. Continue to stay aware of your surroundings.';
      default:
        return 'Unable to determine risk level. Stay cautious.';
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        followsUserLocation={false}
        showsMyLocationButton
        initialRegion={ULM_REGION}
        onRegionChangeComplete={setMapRegion}
      >
        {riskAreas.map((area, index) => (
          <Polygon
            key={index}
            coordinates={area.coordinates}
            fillColor={getRiskColor(area.riskLevel)}
            strokeColor={getRiskColor(area.riskLevel)}
            strokeWidth={2}
            tappable={true}
            onPress={() => {
              Alert.alert(
                'Area Risk Level',
                `This area is ${area.riskLevel === 'A' ? 'High Risk' : 
                  area.riskLevel === 'B' ? 'Moderate Risk' : 
                  area.riskLevel === 'C' ? 'Low Risk' : 'Safe'}\n\n` +
                `Radius: ${(area.radius * 1000).toFixed(0)} meters`
              );
            }}
          />
        ))}
      </MapView>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: 'rgba(255, 0, 0, 0.5)' }]} />
          <ThemedText style={styles.legendText}>High Risk</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: 'rgba(255, 165, 0, 0.5)' }]} />
          <ThemedText style={styles.legendText}>Moderate Risk</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: 'rgba(255, 255, 0, 0.5)' }]} />
          <ThemedText style={styles.legendText}>Low Risk</ThemedText>
        </View>
      </View>

      {isInitializing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A237E" />
          <ThemedText style={styles.loadingText}>
            Initializing safety features...
          </ThemedText>
        </View>
      )}

      {!isInitializing && riskLevel && (
        <View style={[
          styles.riskIndicator,
          { backgroundColor: getRiskColor(riskLevel) }
        ]}>
          <ThemedText style={styles.riskText}>
            Current Risk Level: {riskLevel}
          </ThemedText>
        </View>
      )}

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            (isSending || isInitializing) && styles.disabledButton
          ]}
          onPress={() => location && checkRiskArea(location, true)}
          disabled={isSending || isInitializing}
        >
          <FontAwesome 
            name="refresh" 
            size={20} 
            color="#fff" 
          />
          <ThemedText style={styles.buttonText}>
            {isSending ? 'Checking...' : 'Check Now'}
          </ThemedText>
        </TouchableOpacity>

        {errorMsg && !isInitializing && (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

const getRiskColor = (level: string) => {
  switch (level) {
    case 'A':
      return 'rgba(255, 0, 0, 0.5)';
    case 'B':
      return 'rgba(255, 165, 0, 0.5)';
    case 'C':
      return 'rgba(255, 255, 0, 0.5)';
    default:
      return 'transparent';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A237E',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
  },
  errorText: {
    color: '#DC3545',
    textAlign: 'center',
  },
  riskIndicator: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  riskText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: 'rgba(128, 128, 128, 0.5)',
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1A237E',
    textAlign: 'center',
  },
  legendContainer: {
    position: 'absolute',
    bottom: 20,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    width: 140,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 