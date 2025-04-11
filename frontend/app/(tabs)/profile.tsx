import { StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useGoogleAuth } from '../../services/auth';

export default function ProfileScreen() {
  const { signOut } = useGoogleAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Profile</ThemedText>
      <ThemedText style={styles.description}>Manage your account and preferences</ThemedText>
      
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  description: {
    marginVertical: 20,
    textAlign: 'center',
  },
  signOutButton: {
    backgroundColor: '#DC3545',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  signOutText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 