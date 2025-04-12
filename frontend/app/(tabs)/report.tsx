import React, { useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { FontAwesome } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Specific crime types with distinct categories
const CRIME_TYPES = [
  { id: 'ASSAULT', label: 'Assault', description: 'Physical attack or threat', riskLevel: 'A' },
  { id: 'ROBBERY', label: 'Robbery', description: 'Theft with force or threat', riskLevel: 'A' },
  { id: 'THEFT', label: 'Theft', description: 'Stealing without force', riskLevel: 'B' },
  { id: 'VANDALISM', label: 'Vandalism', description: 'Property damage', riskLevel: 'B' },
  { id: 'HARASSMENT', label: 'Harassment', description: 'Threatening behavior', riskLevel: 'C' },
  { id: 'TRESPASSING', label: 'Trespassing', description: 'Unauthorized entry', riskLevel: 'C' },
  { id: 'DISTURBANCE', label: 'Disturbance', description: 'Public disorder', riskLevel: 'D' },
  { id: 'SUSPICIOUS', label: 'Suspicious Activity', description: 'Unusual behavior', riskLevel: 'D' },
];

const ULM_REGION = {
  latitude: 32.5293,
  longitude: -92.0745,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function ReportScreen() {
  const [selectedLocation, setSelectedLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [selectedCrime, setSelectedCrime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mapRef = useRef<MapView>(null);

  const handleMapPress = (e: any) => {
    setSelectedLocation(e.nativeEvent.coordinate);
  };

  const handleSubmit = async () => {
    if (!selectedLocation || !selectedCrime) {
      return;
    }

    setIsSubmitting(true);
    const crimeType = CRIME_TYPES.find(c => c.id === selectedCrime);

    try {
      const response = await fetch('http://10.255.43.142:8001/api/report_crime/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          crime_type: crimeType?.riskLevel || 'D',
          incident_type: selectedCrime,
          description: crimeType?.description || '',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      const data = await response.json();
      
      // Reset form
      setSelectedLocation(null);
      setSelectedCrime(null);
      
      // Show success with risk assessment
      alert(`Report submitted successfully!\nRisk Category: ${data.risk_area.risk_category}\nRisk Score: ${data.risk_area.risk_score.toFixed(2)}`);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.title}>Report Incident</ThemedText>
        
        {/* Map Section */}
        <View style={styles.mapContainer}>
          <ThemedText style={styles.sectionTitle}>Select Location</ThemedText>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={ULM_REGION}
            onPress={handleMapPress}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                pinColor="#FF0000"
              />
            )}
          </MapView>
          {selectedLocation && (
            <ThemedText style={styles.locationText}>
              Location selected: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
            </ThemedText>
          )}
        </View>

        {/* Crime Type Selection */}
        <View style={styles.crimeTypeContainer}>
          <ThemedText style={styles.sectionTitle}>Select Incident Type</ThemedText>
          <View style={styles.crimeGrid}>
            {CRIME_TYPES.map((crime) => (
              <TouchableOpacity
                key={crime.id}
                style={[
                  styles.crimeTypeButton,
                  selectedCrime === crime.id && styles.selectedCrimeType,
                ]}
                onPress={() => setSelectedCrime(crime.id)}
              >
                <View style={styles.crimeTypeContent}>
                  <ThemedText style={styles.crimeTypeLabel}>{crime.label}</ThemedText>
                  <ThemedText style={styles.crimeTypeDescription}>{crime.description}</ThemedText>
                  <View style={[styles.riskBadge, { backgroundColor: getRiskColor(crime.riskLevel) }]}>
                    <ThemedText style={styles.riskText}>Risk {crime.riskLevel}</ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedLocation || !selectedCrime || isSubmitting) && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={!selectedLocation || !selectedCrime || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.submitButtonText}>Submit Report</ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
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
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    marginHorizontal: 20,
    color: '#1A237E',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1A237E',
  },
  mapContainer: {
    margin: 20,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  locationText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666666',
  },
  crimeTypeContainer: {
    margin: 20,
  },
  crimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  crimeTypeButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    marginBottom: 5,
  },
  selectedCrimeType: {
    borderColor: '#1A237E',
    backgroundColor: '#F5F5FF',
  },
  crimeTypeContent: {
    gap: 4,
  },
  crimeTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  crimeTypeDescription: {
    fontSize: 12,
    color: '#666666',
  },
  riskBadge: {
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  riskText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#1A237E',
    padding: 16,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: 'rgba(26, 35, 126, 0.5)',
  },
}); 