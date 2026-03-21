import React from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, EBGaramond_400Regular, EBGaramond_500Medium, EBGaramond_700Bold } from '@expo-google-fonts/eb-garamond';

import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import PolicyScreen from './screens/PolicyScreen';
import ClaimsScreen from './screens/ClaimsScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();

const hideSplash = async () => {
  try {
    await SplashScreen.hideAsync();
  } catch (e) {
    // ignore
  }
};

export default function App() {
  const [fontsLoaded] = useFonts({
    EBGaramond_400Regular,
    EBGaramond_500Medium,
    EBGaramond_700Bold,
  });

  const onLayoutRootView = React.useCallback(async () => {
    if (fontsLoaded) {
      await hideSplash();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFDFB', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#A51C30" />
      </View>
    );
  }

  return (
    <NavigationContainer onReady={onLayoutRootView}>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Policy" component={PolicyScreen} />
        <Stack.Screen name="Claims" component={ClaimsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
