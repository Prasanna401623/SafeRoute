import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Platform } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { FontAwesome } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

const DJANGO_API_URL = 'http://10.255.43.142:8001/api/risk-area';  // Updated to use port 8001
const DISTANCE_THRESHOLD = 25; // meters - reduced for more frequent checks
const CHECK_INTERVAL = 5000; // 5 seconds
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
  const lastCheckedLocation = useRef<{ latitude: number; longitude: number } | null>(null);
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    setupLocationUpdates();
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
      checkRiskArea(currentLocation);

      // Center map on current location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }

      // Watch for location changes
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: DISTANCE_THRESHOLD,
          timeInterval: CHECK_INTERVAL,
        },
        (newLocation) => {
          setLocation(newLocation);
          checkIfShouldUpdateRisk(newLocation);
          
          // Animate map to new location
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          }
        }
      );
    } catch (error) {
      console.error('Error:', error);
      setErrorMsg('Error getting location');
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

    if (distance >= DISTANCE_THRESHOLD) {
      lastCheckedLocation.current = {
        latitude: newLocation.coords.latitude,
        longitude: newLocation.coords.longitude,
      };
      checkRiskArea(newLocation);
    }
  };

  const checkRiskArea = async (currentLocation: Location.LocationObject) => {
    try {
      setIsSending(true);
      const url = `${DJANGO_API_URL}/?lat=${currentLocation.coords.latitude}&lon=${currentLocation.coords.longitude}&radius=0.1`;  // 100 meters
      console.log('Checking URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        
        // Parse error text if it's JSON
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `Server returned ${response.status}`);
        } catch (e) {
          throw new Error(`Server returned ${response.status}: ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('Risk data received:', data);
      
      // Default to "D" (safe) if no risk category is returned
      const category = data.risk_category || "D";
      
      if (category !== riskLevel) {
        setRiskLevel(category);
        
        if (category === 'A' || category === 'B') {
          Alert.alert(
            'Safety Alert!',
            `You have entered a high-risk area (Level ${category}).\nPlease be cautious and aware of your surroundings.`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error checking risk area:', error);
      setErrorMsg(error instanceof Error ? error.message : 'Failed to check risk level');
      // Default to safe when there's an error
      setRiskLevel('D');
    } finally {
      setIsSending(false);
    }
  };

  const onRegionChange = (region: Region) => {
    // Only check risk if we've moved significantly
    if (location && lastCheckedLocation.current) {
      const distance = calculateDistance(
        lastCheckedLocation.current.latitude,
        lastCheckedLocation.current.longitude,
        region.latitude,
        region.longitude
      );

      if (distance >= DISTANCE_THRESHOLD) {
        checkRiskArea({
          coords: {
            latitude: region.latitude,
            longitude: region.longitude,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      }
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
        onRegionChange={onRegionChange}
      />

      {/* Risk Level Indicator */}
      {riskLevel && (
        <View style={[
          styles.riskIndicator,
          { backgroundColor: getRiskColor(riskLevel) }
        ]}>
          <ThemedText style={styles.riskText}>
            Risk Level: {riskLevel}
          </ThemedText>
        </View>
      )}

      {/* Controls Overlay */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.sendButton, isSending && styles.disabledButton]}
          onPress={() => location && checkRiskArea(location)}
          disabled={isSending}
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

        {errorMsg && (
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
}); 