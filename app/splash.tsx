import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/ui';
import { colors } from '@/theme/tokens';
export default function SplashScreen() { const router = useRouter(); useEffect(() => { const timer = setTimeout(() => router.replace('/onboarding'), 900); return () => clearTimeout(timer); }, [router]); return <SafeAreaView style={s.safe}><View style={s.center}><BrandMark size={74} /><Text style={s.brand}>PujaConnect</Text><Text style={s.tagline}>Your traditions, thoughtfully taken care of.</Text></View></SafeAreaView>; }
const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, brand: { marginTop: 17, fontSize: 25, fontWeight: '700', letterSpacing: -0.6, color: colors.ink }, tagline: { color: colors.muted, fontSize: 11, marginTop: 5 } });
