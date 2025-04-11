import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useGoogleAuth } from '../services/auth';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = React.useState(false);
  const { signInWithGoogle } = useGoogleAuth();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const userInfo = await signInWithGoogle();
      if (userInfo) {
        // Navigate to home screen after successful login
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Logo and Title */}
      <View style={styles.header}>
        <Text style={styles.title}>SafeRoute</Text>
        <Text style={styles.subtitle}>Navigate with Confidence</Text>
      </View>

      {/* Login Form */}
      <View style={styles.formContainer}>
        <TouchableOpacity 
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={isLoading}
        >
          <FontAwesome name="google" size={24} color="#DB4437" style={styles.googleIcon} />
          <Text style={styles.googleButtonText}>
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </Text>
          {isLoading && <ActivityIndicator style={styles.loader} color="#4285F4" />}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity 
          style={styles.emailButton}
          disabled={isLoading}
        >
          <Text style={styles.emailButtonText}>Continue with Email</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
  },
  loader: {
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666666',
  },
  emailButton: {
    backgroundColor: '#1A237E',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    paddingBottom: 24,
  },
  footerText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 12,
  },
}); 