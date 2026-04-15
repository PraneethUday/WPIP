import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  EBGaramond_400Regular,
  EBGaramond_500Medium,
  EBGaramond_700Bold,
} from '@expo-google-fonts/eb-garamond';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import PolicyScreen from './screens/PolicyScreen';
import ClaimsScreen from './screens/ClaimsScreen';
import ProfileScreen from './screens/ProfileScreen';
import PaymentScreen from './screens/PaymentScreen';

const Stack = createNativeStackNavigator();

const hideSplash = async () => {
  try { await SplashScreen.hideAsync(); } catch {}
};

function AppNavigator() {
  const { user, loading } = useAuth();
  const { COLORS } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={user ? 'Home' : 'Landing'}
      screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Policy" component={PolicyScreen} />
      <Stack.Screen name="Claims" component={ClaimsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Payments" component={PaymentScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    EBGaramond_400Regular,
    EBGaramond_500Medium,
    EBGaramond_700Bold,
  });

  const onLayoutRootView = React.useCallback(async () => {
    if (fontsLoaded) await hideSplash();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#04052E', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#A51C30" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer onReady={onLayoutRootView}>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  );
}
