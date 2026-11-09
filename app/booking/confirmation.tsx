import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heading, Label, PrimaryButton, Surface } from '@/components/ui';
import type { BookingView } from '@/services/marketplace';
import { getBooking } from '@/services/marketplace';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors } from '@/theme/tokens';

export default function BookingConfirmation() {
  const router = useRouter();
  const { id, mode } = useLocalSearchParams<{ id?: string; mode?: string }>();
  const [booking, setBooking] = useState<BookingView | null>(null);
  const [loading, setLoading] = useState(mode === 'live');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'live' || !id || !isSupabaseConfigured) return;
    let active = true;
    getBooking(id).then(result => {
      if (active) setBooking(result);
    }).catch(loadError => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'We could not load this booking.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [id, mode]);

  const date = booking ? new Date(booking.scheduled_at) : null;

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}><View style={[s.icon, mode === 'live' && s.liveIcon]}><Feather name={mode === 'live' ? 'check' : 'clock'} size={28} color={mode === 'live' ? colors.sage : colors.terracotta} /></View><Label>{mode === 'live' ? 'REQUEST SUBMITTED' : 'DEMO PREVIEW'}</Label><Heading style={s.heading}>{mode === 'live' ? 'Your request has been sent.' : 'This request was not sent.'}</Heading><Text style={s.copy}>{mode === 'live' ? 'The pandit has not accepted yet. Your booking is requested, not confirmed.' : 'Demo mode does not create a booking, reserve a slot, or take payment.'}</Text>{loading ? <ActivityIndicator color={colors.terracotta} /> : error ? <Text style={s.error}>{error}</Text> : mode === 'live' && booking ? <Surface style={s.ref}>{[['REFERENCE', booking.id.slice(0, 8).toUpperCase()], ['PUJA', booking.service_name], ['DATE & TIME', date?.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) ?? ''], ['STATUS', booking.status.toUpperCase()], ['PRICE SNAPSHOT', `₹${booking.total_price.toLocaleString('en-IN')}`], ['PAYMENT', 'Not processed']].map(([label, value]) => <View key={label} style={s.detail}><Text style={s.refLabel}>{label}</Text><Text style={s.refValue}>{value}</Text></View>)}</Surface> : <Surface style={s.ref}><Text style={s.refLabel}>STATUS</Text><Text style={s.refValue}>No booking has been created</Text><Text style={s.copy}>Explore sample listings, or configure Supabase to request a real booking.</Text></Surface>}<PrimaryButton title="View my bookings" onPress={() => router.replace('/(tabs)/bookings')} /><Pressable onPress={() => router.replace('/(tabs)')}><Text style={s.link}>Back to home</Text></Pressable></ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { flexGrow: 1, padding: 26, justifyContent: 'center', alignItems: 'center', gap: 17 }, icon: { width: 74, height: 74, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.terracottaSoft }, liveIcon: { backgroundColor: colors.sageSoft }, heading: { textAlign: 'center', marginTop: 4 }, copy: { color: colors.muted, textAlign: 'center', fontSize: 13, lineHeight: 20 }, ref: { width: '100%', gap: 12 }, detail: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: 10 }, refLabel: { fontSize: 9, color: colors.muted, letterSpacing: 1 }, refValue: { color: colors.ink, fontWeight: '700', fontSize: 13, marginTop: 6 }, link: { color: colors.terracotta, fontSize: 12, fontWeight: '700', padding: 8 }, error: { color: colors.terracotta, fontSize: 12, lineHeight: 18, textAlign: 'center' } });
