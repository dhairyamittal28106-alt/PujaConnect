import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthProvider';
import { ErrorState, LoadingState } from '@/components/AsyncState';
import { Heading, Label, Pill, Surface } from '@/components/ui';
import type { BookingView } from '@/services/marketplace';
import { changeBookingStatus, getAssignedBookings } from '@/services/marketplace';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors } from '@/theme/tokens';

export default function PanditBookingsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [bookings, setBookings] = useState<BookingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !isSupabaseConfigured) {
      setBookings([]);
      setLoading(false);
      setError('Sign in with an approved pandit account to see assigned requests.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setBookings(await getAssignedBookings(session.user.id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'We could not load assigned bookings.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  async function act(id: string, action: 'accept_booking' | 'decline_booking' | 'complete_booking') {
    setBusyId(id);
    setError(null);
    try {
      await changeBookingStatus(action, id);
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'We could not update this booking.');
    } finally {
      setBusyId(null);
    }
  }

  return <SafeAreaView style={s.safe} edges={['top']}><ScrollView contentContainerStyle={s.content}><Pressable onPress={() => router.back()} style={s.back}><Feather name="arrow-left" size={19} color={colors.ink} /></Pressable><Label>PANDIT SPACE</Label><Heading style={{ marginTop: 7 }}>Assigned requests</Heading><Text style={s.sub}>Only bookings assigned to your account are shown here.</Text><Pressable onPress={() => router.push('/pandit-profile')}><Text style={s.profileLink}>Manage pandit profile</Text></Pressable>{loading ? <LoadingState label="Loading assigned requests…" /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : bookings.length ? bookings.map(booking => { const canComplete = booking.status === 'accepted' && new Date(booking.scheduled_at).getTime() + booking.duration_minutes * 60000 <= Date.now(); return <Pressable key={booking.id} onPress={() => router.push({ pathname: '/booking/[id]', params: { id: booking.id } })}><Surface style={s.card}><View style={s.row}><Text style={s.title}>{booking.service_name}</Text><Pill tone={booking.status === 'accepted' ? 'sage' : booking.status === 'requested' ? 'warm' : 'plain'}>{booking.status}</Pill></View><Text style={s.sub}>{new Date(booking.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</Text><Text style={s.address}>{booking.address}, {booking.city} {booking.postal_code}</Text><Text style={s.price}>₹{booking.total_price.toLocaleString('en-IN')} · price snapshot</Text>{busyId === booking.id ? <Text style={s.sub}>Updating…</Text> : booking.status === 'requested' ? <View style={s.actions}><Action label="Accept" onPress={() => void act(booking.id, 'accept_booking')} /><Action label="Decline" secondary onPress={() => void act(booking.id, 'decline_booking')} /></View> : canComplete ? <View style={s.actions}><Action label="Mark completed" onPress={() => void act(booking.id, 'complete_booking')} /></View> : null}</Surface></Pressable>; }) : <View style={s.empty}><Feather name="calendar" size={23} color={colors.sage} /><Text style={s.title}>No assigned bookings</Text><Text style={s.sub}>New requests will appear here when assigned to your account.</Text></View>}</ScrollView></SafeAreaView>;
}

function Action({ label, onPress, secondary = false }: { label: string; onPress: () => void; secondary?: boolean }) {
  return <Pressable onPress={onPress} style={[s.action, secondary && s.secondary]}><Text style={[s.actionText, secondary && s.secondaryText]}>{label}</Text></Pressable>;
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 22, paddingBottom: 35 }, back: { width: 40, height: 40, borderRadius: 15, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 18 }, sub: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 7 }, profileLink: { color: colors.terracotta, fontSize: 12, fontWeight: '700', marginTop: 12 }, card: { marginTop: 14 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 9 }, title: { color: colors.ink, fontSize: 13, fontWeight: '700' }, address: { color: colors.ink, fontSize: 11, marginTop: 9, lineHeight: 17 }, price: { color: colors.ink, fontSize: 11, fontWeight: '600', marginTop: 8 }, actions: { flexDirection: 'row', gap: 8, marginTop: 13 }, action: { minHeight: 40, backgroundColor: colors.terracotta, paddingHorizontal: 13, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, actionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' }, secondary: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line }, secondaryText: { color: colors.ink }, empty: { alignItems: 'center', gap: 9, padding: 45 } });

