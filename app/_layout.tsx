import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  return <SafeAreaProvider><StatusBar barStyle="dark-content" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas }, animation: 'slide_from_right' }}><Stack.Screen name="(tabs)" /><Stack.Screen name="puja/[id]" /><Stack.Screen name="pandit/[id]" /><Stack.Screen name="booking/index" /><Stack.Screen name="onboarding" /><Stack.Screen name="splash" /><Stack.Screen name="otp" /><Stack.Screen name="support" /><Stack.Screen name="auth" /></Stack></SafeAreaProvider>;
}



