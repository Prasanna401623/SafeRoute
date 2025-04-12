import { StyleSheet, Platform, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>SafeRoute</ThemedText>
        <ThemedText style={styles.subtitle}>Navigate with Confidence</ThemedText>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome name="map-marker" size={24} color="#DB4437" style={styles.actionIcon} />
          <ThemedText style={styles.actionText}>Start Navigation</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome name="history" size={24} color="#4285F4" style={styles.actionIcon} />
          <ThemedText style={styles.actionText}>Recent Routes</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Safety Tips */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Safety Tips</ThemedText>
        <View style={styles.tipContainer}>
          <FontAwesome name="lightbulb-o" size={20} color="#F4B400" style={styles.tipIcon} />
          <ThemedText style={styles.tipText}>Stay in well-lit areas during night travel</ThemedText>
        </View>
        <View style={styles.tipContainer}>
          <FontAwesome name="bell" size={20} color="#0F9D58" style={styles.tipIcon} />
          <ThemedText style={styles.tipText}>Enable notifications for safety alerts</ThemedText>
        </View>
      </View>

      {/* Crime Statistics */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Area Statistics</ThemedText>
        <ThemedText style={styles.descriptionText}>
          View real-time crime statistics and safety scores for your area.
        </ThemedText>
        <TouchableOpacity style={styles.statsButton}>
          <ThemedText style={styles.statsButtonText}>View Statistics</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  header: {
    marginTop: Platform.OS === 'ios' ? 40 : 20,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 50,
    paddingTop: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
    paddingHorizontal: 4,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A237E',
    marginBottom: 16,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIcon: {
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  statsButton: {
    backgroundColor: '#1A237E',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
