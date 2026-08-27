import 'react-native-gesture-handler';
import { View, Text, StyleSheet, ActivityIndicator, Animated as RNAnimated } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';
import { 
  Audio, 
  InterruptionModeAndroid, 
  InterruptionModeIOS 
} from 'expo-av';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';

import { useColorScheme } from '../components/useColorScheme';
import { Theme } from '../constants/Theme';
import { SettingsProvider } from '../context/SettingsContext';
import { TintinProvider } from '../context/TintinContext';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

// Custom animated loading screen using RN Animated (reliable on Android)
function AppSplash() {
  const spin = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: (t) => t, // linear
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={splashStyles.container}>
      <View style={splashStyles.logoWrap}>
        {/* Spinning green arc around the image */}
        <RNAnimated.View style={[splashStyles.ring, { transform: [{ rotate }] }]} />
      </View>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 5,
    borderColor: '#e3849f',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  logo: {
    width: 110,
    height: 110,
  },
});


// --- KILL SWITCH LOGIC ---
const ADMIN_URL = "https://YOUR-VERCEL-URL.vercel.app"; // Replace with your Vercel URL

function useKillSwitch() {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    async function checkLockStatus() {
      try {
        // 1. Get or create a unique device ID
        let deviceId = await AsyncStorage.getItem('@sposify/device_id');
        if (!deviceId) {
          deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
          await AsyncStorage.setItem('@sposify/device_id', deviceId);
        }

        // 2. Check remote status
        const res = await fetch(`${ADMIN_URL}/api/check?deviceId=${deviceId}&name=Store`);
        const data = await res.json();
        
        if (data && data.locked === true) {
          setIsLocked(true);
          await AsyncStorage.setItem('@sposify/locked', 'true');
        } else {
          setIsLocked(false);
          await AsyncStorage.setItem('@sposify/locked', 'false');
        }
      } catch (e) {
        // Offline fallback: check last known status
        const savedLock = await AsyncStorage.getItem('@sposify/locked');
        if (savedLock === 'true') setIsLocked(true);
      }
    }
    
    // Check after 2 seconds to not block startup
    if (ADMIN_URL !== "https://YOUR-VERCEL-URL.vercel.app") {
      setTimeout(checkLockStatus, 2000);
    }
  }, []);

  return isLocked;
}

function LockedOverlay() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: 24 }]}>
      <FontAwesome name="lock" size={64} color="#DF7A96" style={{ marginBottom: 20 }} />
      <Text style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, color: '#DF7A96', marginBottom: 12 }}>App Locked</Text>
      <Text style={{ fontFamily: 'Manrope-Medium', fontSize: 16, color: '#666', textAlign: 'center' }}>
        This application has been locked by the developer. Please contact support to resolve this issue and restore access.
      </Text>
    </View>
  );
}
// -----------------------

export default function RootLayout() {
  const appStartTime = useRef(Date.now()).current;
  const [loaded, error] = useFonts({
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'PlusJakartaSans-ExtraBold': PlusJakartaSans_800ExtraBold,
    'Manrope-Regular': Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
    ...FontAwesome.font,
  });

  // Controls our CUSTOM splash — stays true for 2.5s after fonts load
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Step 1: Hide the NATIVE splash immediately so our custom one becomes visible
      SplashScreen.hideAsync();

      // Step 2: Run non-blocking init
      Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        playThroughEarpieceAndroid: false,
      }).catch(err => console.error("Audio mode error:", err));

      // Step 3: Keep our custom AppSplash visible for 2.5s minimum
      const elapsed = Date.now() - appStartTime;
      const remaining = Math.max(0, 2500 - elapsed);
      const timer = setTimeout(() => setShowSplash(false), remaining);
      return () => clearTimeout(timer);
    }
  }, [loaded]);


  const isLocked = useKillSwitch();

  if (!loaded || showSplash) {
    return <AppSplash />;
  }

  return (
    <SettingsProvider>
      <TintinProvider>
        <View style={{ flex: 1, backgroundColor: Theme.colors.background }}>
          {isLocked && <LockedOverlay />}
          <RootLayoutNav />
        </View>
      </TintinProvider>
    </SettingsProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" backgroundColor={Theme.colors.background} translucent={false} />
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ 
          contentStyle: { backgroundColor: Theme.colors.background }, 
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 220,
        }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="sales-history" options={{ headerShown: false }} />
          <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="transaction/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="history" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

