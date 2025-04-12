import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import MapView, { Region, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { FontAwesome } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { API_BASE_URL } from '@/constants/config';

const DISTANCE_THRESHOLD = 100; // meters - check only after moving 100 meters
const CHECK_INTERVAL = 15000; // 15 seconds - reduced frequency
const ULM_REGION = {
  latitude: 32.5293, // ULM Library coordinates
  longitude: -92.0745,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
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
  const lastAlertTime = useRef<number>(0);

  useEffect(() => {
    const initialize = async () => {
      setIsInitializing(true);
      try {
        // Wait for location setup first
        await setupLocationUpdates();
        
        // Add a small delay before checking risk
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get initial location and check risk
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        if (currentLocation) {
          await checkRiskArea(currentLocation);
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

  const setupLocationUpdates = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // Get initial location
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      setLocation(currentLocation);
      
      // Don't check risk area immediately, wait for initialization
      if (!isInitializing) {
        checkRiskArea(currentLocation);
      }

      // Watch for location changes with less frequent updates
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
      throw error; // Propagate error for initialization handling
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
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
    if (isSending) return; // Skip if already checking

    if (!lastCheckedLocation.current) {
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

    // Only check if we've moved at least DISTANCE_THRESHOLD meters
    if (distance >= DISTANCE_THRESHOLD) {
      lastCheckedLocation.current = {
        latitude: newLocation.coords.latitude,
        longitude: newLocation.coords.longitude,
      };
      checkRiskArea(newLocation);
    }
  };

  const checkRiskArea = async (currentLocation: Location.LocationObject, isManualCheck: boolean = false) => {
    if (isSending) return; // Prevent multiple simultaneous requests

    try {
      setIsSending(true);
      const url = `${API_BASE_URL}/risk/?lat=${currentLocation.coords.latitude}&lon=${currentLocation.coords.longitude}&radius=0.1`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      
      // Default to "D" (safe) if no risk category is returned
      const category = data.risk_category || "D";
      const riskScore = data.risk_score || 0;
      
      if (category !== riskLevel) {
        setRiskLevel(category);
        
        // Show alerts for manual checks or high-risk areas
        const now = Date.now();
        if (isManualCheck || 
            ((category === 'A' || category === 'B') && 
             (now - lastAlertTime.current > 300000))) { // 5 minutes between automatic alerts
          lastAlertTime.current = now;
          Alert.alert(
            'Risk Assessment',
            `Risk Level: ${category}\nRisk Score: ${riskScore.toFixed(2)}\n\n${getRiskMessage(category)}`,
            [{ text: 'OK' }]
          );
        }
      } else if (isManualCheck) {
        // Always show alert for manual checks, even if risk level hasn't changed
        Alert.alert(
          'Risk Assessment',
          `Risk Level: ${category}\nRisk Score: ${riskScore.toFixed(2)}\n\n${getRiskMessage(category)}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error checking risk area:', error);
      if (isManualCheck) { // Only show error for manual checks
        setErrorMsg('Unable to check risk level');
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
        followsUserLocation
        showsMyLocationButton
        initialRegion={ULM_REGION}
      />

      {/* Loading Indicator */}
      {isInitializing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A237E" />
          <ThemedText style={styles.loadingText}>
            Initializing safety features...
          </ThemedText>
        </View>
      )}

      {/* Risk Level Indicator */}
      {!isInitializing && riskLevel && (
        <View style={[
          styles.riskIndicator,
          { backgroundColor: getRiskColor(riskLevel) }
        ]}>
          <ThemedText style={styles.riskText}>
            Risk Level: {riskLevel}
          </ThemedText>
        </View>
      )}

      {/* Manual Check Button */}
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
    case 'A': return 'rgba(255, 0, 0, 0.7)'; // Red
    case 'B': return 'rgba(255, 165, 0, 0.7)'; // Orange
    case 'C': return 'rgba(255, 255, 0, 0.7)'; // Yellow
    case 'D': return 'rgba(0, 255, 0, 0.7)'; // Green
    default: return 'rgba(128, 128, 128, 0.7)'; // Gray
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
}); 