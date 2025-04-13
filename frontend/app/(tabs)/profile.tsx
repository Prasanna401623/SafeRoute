import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Image, ScrollView, Switch } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useGoogleAuth } from '../../services/auth';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function ProfileScreen() {
  const { userInfo, signOut } = useGoogleAuth();
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [emergencyContacts, setEmergencyContacts] = useState([
    { name: 'Police', number: '100' },
    { name: 'Ambulance', number: '102' },
    { name: 'Fire', number: '101' },
  ]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // TODO: Implement dark mode toggle functionality
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#1A1A1A' : '#f5f5f5' }]}>
      <ScrollView style={styles.container}>
        {/* Profile Header */}
        <View style={[styles.header, { backgroundColor: isDarkMode ? '#2A2A2A' : '#fff' }]}>
          <View style={styles.profileImageContainer}>
            {userInfo?.photoUrl ? (
              <Image 
                source={{ uri: userInfo.photoUrl }} 
                style={styles.profileImage}
                defaultSource={require('../../assets/images/icon.png')}
              />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: isDarkMode ? '#3A3A3A' : '#E8EAF6' }]}>
                <FontAwesome name="user" size={40} color={isDarkMode ? '#fff' : '#1A237E'} />
              </View>
            )}
          </View>
          <ThemedText style={[styles.name, { color: isDarkMode ? '#fff' : '#1A237E' }]}>
            {userInfo?.displayName || 'Welcome'}
          </ThemedText>
          <ThemedText style={[styles.email, { color: isDarkMode ? '#aaa' : '#666' }]}>
            {userInfo?.email}
          </ThemedText>
        </View>

        {/* User Statistics */}
        <View style={[styles.section, { backgroundColor: isDarkMode ? '#2A2A2A' : '#fff' }]}>
          <ThemedText style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#1A237E' }]}>
            Your Safety Stats
          </ThemedText>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <FontAwesome name="map-marker" size={24} color={isDarkMode ? '#fff' : '#1A237E'} />
              <ThemedText style={[styles.statValue, { color: isDarkMode ? '#fff' : '#1A237E' }]}>12</ThemedText>
              <ThemedText style={[styles.statLabel, { color: isDarkMode ? '#aaa' : '#666' }]}>Safe Routes</ThemedText>
            </View>
            <View style={styles.statItem}>
              <FontAwesome name="exclamation-triangle" size={24} color={isDarkMode ? '#fff' : '#1A237E'} />
              <ThemedText style={[styles.statValue, { color: isDarkMode ? '#fff' : '#1A237E' }]}>3</ThemedText>
              <ThemedText style={[styles.statLabel, { color: isDarkMode ? '#aaa' : '#666' }]}>Reports</ThemedText>
            </View>
            <View style={styles.statItem}>
              <FontAwesome name="shield" size={24} color={isDarkMode ? '#fff' : '#1A237E'} />
              <ThemedText style={[styles.statValue, { color: isDarkMode ? '#fff' : '#1A237E' }]}>15</ThemedText>
              <ThemedText style={[styles.statLabel, { color: isDarkMode ? '#aaa' : '#666' }]}>Tips Shared</ThemedText>
            </View>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={[styles.section, { backgroundColor: isDarkMode ? '#2A2A2A' : '#fff' }]}>
          <ThemedText style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#1A237E' }]}>
            Emergency Contacts
          </ThemedText>
          {emergencyContacts.map((contact, index) => (
            <View key={index} style={[styles.contactItem, { borderBottomColor: isDarkMode ? '#3A3A3A' : '#eee' }]}>
              <FontAwesome name="phone" size={20} color={isDarkMode ? '#fff' : '#1A237E'} />
              <View style={styles.contactInfo}>
                <ThemedText style={[styles.contactName, { color: isDarkMode ? '#fff' : '#333' }]}>
                  {contact.name}
                </ThemedText>
                <ThemedText style={[styles.contactNumber, { color: isDarkMode ? '#aaa' : '#666' }]}>
                  {contact.number}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* App Settings */}
        <View style={[styles.section, { backgroundColor: isDarkMode ? '#2A2A2A' : '#fff' }]}>
          <ThemedText style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#1A237E' }]}>
            App Settings
          </ThemedText>
          <View style={[styles.settingItem, { borderBottomColor: isDarkMode ? '#3A3A3A' : '#eee' }]}>
            <View style={styles.settingInfo}>
              <FontAwesome name="moon-o" size={20} color={isDarkMode ? '#fff' : '#1A237E'} />
              <ThemedText style={[styles.settingText, { color: isDarkMode ? '#fff' : '#333' }]}>
                Dark Mode
              </ThemedText>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isDarkMode ? '#1A237E' : '#f4f3f4'}
            />
          </View>
          <View style={[styles.settingItem, { borderBottomColor: isDarkMode ? '#3A3A3A' : '#eee' }]}>
            <View style={styles.settingInfo}>
              <FontAwesome name="bell" size={20} color={isDarkMode ? '#fff' : '#1A237E'} />
              <ThemedText style={[styles.settingText, { color: isDarkMode ? '#fff' : '#333' }]}>
                Notifications
              </ThemedText>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isDarkMode ? '#1A237E' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Sign Out Button */}
        <View style={[styles.section, { backgroundColor: isDarkMode ? '#2A2A2A' : '#fff' }]}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <FontAwesome name="sign-out" size={20} color="#fff" />
            <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 15,
  },
  profileImageContainer: {
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#1A237E',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1A237E',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
  },
  section: {
    margin: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 5,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  contactInfo: {
    marginLeft: 15,
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
  },
  contactNumber: {
    fontSize: 14,
    marginTop: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 15,
  },
  signOutButton: {
    backgroundColor: '#DC3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 