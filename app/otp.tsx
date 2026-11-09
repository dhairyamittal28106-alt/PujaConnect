import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heading, Label, PrimaryButton } from '@/components/ui';
import { colors } from '@/theme/tokens';
import { isSupabaseConfigured } from '@/lib/supabase';
import { requestPhoneOtp, verifyPhoneOtp } from '@/services/auth';

export default function OtpScreen() {
  const router = useRouter();
  const { phone, returnTo } = useLocalSearchParams<{ phone: string; returnTo?: string }>();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function verify() {
    if (!phone || token.length !== 6) {
      setMessage('Enter the six-digit code sent to your phone.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await verifyPhoneOtp(phone, token);
      if (returnTo?.startsWith('/booking?')) {
        const parsed = new URL(returnTo, 'https://pujaconnect.local');
        router.replace({ pathname: '/booking', params: { puja: parsed.searchParams.get('puja') ?? undefined, pandit: parsed.searchParams.get('pandit') ?? undefined } });
      } else {
        router.replace('/(tabs)');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'That code could not be verified. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!phone) return;
    setBusy(true);
    setMessage(null);
    try {
      await requestPhoneOtp(phone);
      setMessage('A new code was requested. Check your messages.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'We could not send another code. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return <SafeAreaView style={s.safe}><View style={s.content}><Pressable onPress={() => router.back()} style={s.back}><Feather name="arrow-left" size={19} color={colors.ink} /></Pressable><Label>PHONE VERIFICATION</Label><Heading>Enter your code.</Heading><Text style={s.copy}>Enter the verification code sent to {phone || 'your phone'}.</Text><TextInput value={token} onChangeText={value => { setToken(value.replace(/\D/g, '').slice(0, 6)); setMessage(null); }} keyboardType="number-pad" maxLength={6} textContentType="oneTimeCode" autoComplete="sms-otp" placeholder="—  —  —  —  —  —" placeholderTextColor={colors.muted} style={s.code} editable={!busy && isSupabaseConfigured} /><Pressable onPress={resend} disabled={busy || !isSupabaseConfigured}><Text style={s.resend}>Resend code</Text></Pressable>{message ? <Text style={s.error}>{message}</Text> : null}{busy ? <ActivityIndicator color={colors.terracotta} /> : <PrimaryButton title="Verify and continue" onPress={verify} disabled={!isSupabaseConfigured || token.length !== 6} />}{!isSupabaseConfigured ? <Text style={s.note}>Demo mode · configure Supabase and an SMS provider to verify a real code.</Text> : <Text style={s.note}>Your sign-in session is securely restored by Supabase when you reopen the app.</Text>}</View></SafeAreaView>;
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { flex: 1, padding: 25, justifyContent: 'center', gap: 17 }, back: { position: 'absolute', top: 18, left: 22, width: 40, height: 40, borderRadius: 15, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }, copy: { color: colors.muted, fontSize: 12, lineHeight: 18 }, code: { height: 58, borderRadius: 15, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF', textAlign: 'center', color: colors.ink, fontSize: 21, letterSpacing: 7 }, resend: { color: colors.terracotta, textAlign: 'center', fontSize: 12, fontWeight: '700', padding: 8 }, error: { color: colors.terracotta, fontSize: 11, lineHeight: 17, textAlign: 'center' }, note: { fontSize: 10, color: colors.muted, textAlign: 'center', lineHeight: 15 } });
