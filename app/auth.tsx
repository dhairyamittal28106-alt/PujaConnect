import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark, Heading, Label, PrimaryButton } from '@/components/ui';
import { colors } from '@/theme/tokens';
import { isSupabaseConfigured } from '@/lib/supabase';
import { requestPhoneOtp } from '@/services/auth';

export default function AuthScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const normalizedPhone = `+91${phone.replace(/\D/g, '')}`;
  const canRequest = /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));

  async function handleContinue() {
    if (!isSupabaseConfigured) {
      setMessage('Authentication is unavailable in demo mode. Add Supabase credentials to enable phone OTP.');
      return;
    }
    if (!canRequest) {
      setMessage('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await requestPhoneOtp(normalizedPhone);
      router.push({ pathname: '/otp', params: { phone: normalizedPhone, returnTo } });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'We could not request a code. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return <SafeAreaView style={s.safe}><View style={s.content}><Pressable onPress={() => router.back()} style={s.back}><Feather name="arrow-left" size={19} color={colors.ink} /></Pressable><BrandMark size={54} /><Label>WELCOME TO PUJACONNECT</Label><Heading>Let’s get you{ '\n' }started.</Heading><Text style={s.copy}>Sign in with your phone number to continue.</Text><View style={s.phone}><Text style={s.country}>+91</Text><TextInput value={phone} onChangeText={value => { setPhone(value.replace(/\D/g, '').slice(0, 10)); setMessage(null); }} keyboardType="phone-pad" maxLength={10} placeholder="Phone number" placeholderTextColor={colors.muted} style={s.input} editable={!busy} /></View>{busy ? <View style={s.loading}><ActivityIndicator color={colors.terracotta} /><Text style={s.note}>Requesting a verification code…</Text></View> : <PrimaryButton title={isSupabaseConfigured ? 'Send verification code' : 'Phone sign-in unavailable'} disabled={!isSupabaseConfigured || !canRequest} onPress={handleContinue} />}<Text style={message ? s.error : s.note}>{message ?? (isSupabaseConfigured ? 'A one-time code will be sent by your Supabase SMS provider.' : 'Demo mode · add Supabase credentials and configure SMS to enable sign-in.')}</Text><Pressable onPress={() => router.replace('/(tabs)')}><Text style={s.guest}>Continue browsing as guest</Text></Pressable></View></SafeAreaView>;
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { flex: 1, padding: 25, justifyContent: 'center', gap: 16 }, back: { position: 'absolute', top: 18, left: 22, width: 40, height: 40, borderRadius: 15, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, copy: { color: colors.muted, fontSize: 13, lineHeight: 19 }, phone: { height: 54, borderWidth: 1, borderColor: colors.line, borderRadius: 15, backgroundColor: '#FFFFFF', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }, country: { color: colors.ink, fontWeight: '700', fontSize: 13 }, input: { flex: 1, color: colors.ink }, note: { fontSize: 10, lineHeight: 15, color: colors.muted, textAlign: 'center' }, error: { fontSize: 11, lineHeight: 17, color: colors.terracotta, textAlign: 'center' }, loading: { minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 5 }, guest: { color: colors.terracotta, fontSize: 12, fontWeight: '700', textAlign: 'center', padding: 10 } });
