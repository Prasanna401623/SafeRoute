import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

interface UserInfo {
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
}

export const useGoogleAuth = () => {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    email: null,
    displayName: 'Prasanna Jha',
    photoUrl: null
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: "969890596290-n832rrc166o71mk1n2k70jaibh018nv1.apps.googleusercontent.com",
    clientId: "969890596290-n832rrc166o71mk1n2k70jaibh018nv1.apps.googleusercontent.com",
    redirectUri: "com.saferoute.app:/oauth2redirect/google",
    scopes: ['profile', 'email']
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (response?.type === 'success' && response.authentication) {
        try {
          // Fetch user profile information
          const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${response.authentication.accessToken}` },
          });
          const userData = await userInfoResponse.json();
          
          const userInfo: UserInfo = {
            email: userData.email,
            displayName: userData.name,
            photoUrl: userData.picture,
          };
          
          setUserInfo(userInfo);
        } catch (error) {
          console.error('Error fetching user info:', error);
        }
      } else if (response?.type === 'error') {
        console.error('Authentication error:', response.error);
      }
    };

    fetchUserInfo();
  }, [response]);

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google Sign-In...');
      const result = await promptAsync();
      console.log('Sign-in result:', result);
      return result;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setUserInfo({
        email: null,
        displayName: 'Prasanna Jha',
        photoUrl: null
      });
    } catch (error) {
      console.error('Sign Out Error:', error);
      throw error;
    }
  };

  return {
    signInWithGoogle,
    signOut,
    userInfo,
  };
}; 