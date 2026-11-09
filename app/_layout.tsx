import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/theme/tokens';
import { AuthProvider } from '@/auth/AuthProvider';

export default function RootLayout() {
  return <SafeAreaProvider><AuthProvider><StatusBar barStyle="dark-content" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas }, animation: 'slide_from_right' }}><Stack.Screen name="(tabs)" /><Stack.Screen name="puja/[id]" /><Stack.Screen name="pandit/[id]" /><Stack.Screen name="booking/index" /><Stack.Screen name="booking/[id]" /><Stack.Screen name="booking/confirmation" /><Stack.Screen name="onboarding" /><Stack.Screen name="splash" /><Stack.Screen name="otp" /><Stack.Screen name="support" /><Stack.Screen name="auth" /><Stack.Screen name="pandit-bookings" /><Stack.Screen name="pandit-profile" /></Stack></AuthProvider></SafeAreaProvider>;
}



