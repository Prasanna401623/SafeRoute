import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { FontAwesome } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

const DJANGO_API_URL = 'http://your-django-backend-url/api'; // Replace with your Django backend URL

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      } catch (error) {
        console.error('Error:', error);
        setErrorMsg('Error getting location');
      }
    })();
  }, []);

  const sendLocationToBackend = async () => {
    if (!location) return;

    try {
      setIsSending(true);
      const response = await fetch(`${DJANGO_API_URL}/locations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send location');
      }

      const data = await response.json();
      console.log('Location sent successfully:', data);
    } catch (error) {
      console.error('Error sending location:', error);
      setErrorMsg('Failed to send location to server');
    } finally {
      setIsSending(false);
    }
  };

  const onRegionChange = (region: Region) => {
    // You can also send location updates when user moves the map
    console.log('Map region changed:', region);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location?.coords?.latitude ?? 37.78825,
          longitude: location?.coords?.longitude ?? -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation
        onRegionChange={onRegionChange}
      />

      {/* Controls Overlay */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.sendButton}
          onPress={sendLocationToBackend}
          disabled={isSending || !location}
        >
          <FontAwesome 
            name="location-arrow" 
            size={20} 
            color="#fff" 
          />
          <ThemedText style={styles.buttonText}>
            {isSending ? 'Sending...' : 'Send Location'}
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
}); 