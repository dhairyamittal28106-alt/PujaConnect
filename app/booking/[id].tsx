import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthProvider';
import { ErrorState, LoadingState } from '@/components/AsyncState';
import { Heading, Label, Pill, Surface } from '@/components/ui';
import type { BookingView } from '@/services/marketplace';
import { changeBookingStatus, getBooking, getPandit } from '@/services/marketplace';
import { colors } from '@/theme/tokens';

export default function BookingDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [booking, setBooking] = useState<BookingView | null>(null);
  const [panditName, setPanditName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!session) {
      setError('Sign in to view this booking.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const value = await getBooking(id);
      setBooking(value);
      if (!value) setError('This booking is unavailable to your account.');
      if (value?.pandit_user_id) {
        const result = await getPandit(value.pandit_user_id);
        setPanditName(result.data?.name ?? 'Assigned pandit');
      } else {
        setPanditName(null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'We could not load this booking.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [id, session]);

  async function cancel() {
    if (!booking) return;
    setBusy(true);
    setError(null);
    try {
      await changeBookingStatus('cancel_booking', booking.id);
      await load();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'We could not cancel this booking.');
    } finally {
      setBusy(false);
    }
  }

  function confirmCancel() {
    if (Platform.OS === 'web') {
      if (window.confirm('Cancel this booking request?')) void cancel();
      return;
    }
    Alert.alert('Cancel this booking?', 'This request will be marked as cancelled.', [{ text: 'Keep booking', style: 'cancel' }, { text: 'Cancel booking', style: 'destructive', onPress: () => void cancel() }]);
  }

  const canCancel = booking && ['requested', 'accepted'].includes(booking.status) && new Date(booking.scheduled_at) > new Date();

  return <SafeAreaView style={s.safe} edges={['top']}><ScrollView contentContainerStyle={s.content}><Pressable onPress={() => router.back()} style={s.back}><Feather name="arrow-left" size={19} color={colors.ink} /></Pressable>{loading ? <LoadingState label="Loading booking…" /> : error && !booking ? <ErrorState message={error} onRetry={() => void load()} /> : booking ? <><Label>BOOKING DETAILS</Label><Heading style={{ marginTop: 7 }}>{booking.service_name}</Heading><View style={s.status}><Pill tone={booking.status === 'accepted' ? 'sage' : booking.status === 'requested' ? 'warm' : 'plain'}>{booking.status}</Pill><Text style={s.reference}>Ref. {booking.id.slice(0, 8).toUpperCase()}</Text></View><Surface style={s.card}><Detail label="Date & time" value={new Date(booking.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} /><Detail label="Status" value={booking.status === 'requested' ? 'Waiting for pandit response' : booking.status} /><Detail label="Pandit" value={panditName ?? 'Not assigned yet'} /><Detail label="Address" value={`${booking.address}, ${booking.city} ${booking.postal_code}`} /><Detail label="Language" value={booking.preferred_language} /><Detail label="Notes" value={booking.notes || 'None'} /></Surface><Surface style={s.card}><Label>PRICE SNAPSHOT</Label><Detail label="Puja service" value={`₹${booking.service_price.toLocaleString('en-IN')}`} /><Detail label="Samagri" value={`₹${booking.samagri_price.toLocaleString('en-IN')}`} /><View style={s.divider} /><Detail label="Total" value={`₹${booking.total_price.toLocaleString('en-IN')}`} strong /><Text style={s.payment}>No payment has been processed.</Text></Surface>{error ? <Text style={s.error}>{error}</Text> : null}{canCancel ? <Pressable style={s.cancel} onPress={confirmCancel} disabled={busy}><Text style={s.cancelText}>{busy ? 'Cancelling…' : 'Cancel booking'}</Text></Pressable> : null}</> : null}</ScrollView></SafeAreaView>;
}

function Detail({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <View style={s.detail}><Text style={s.detailLabel}>{label}</Text><Text style={[s.detailValue, strong && s.strong]}>{value}</Text></View>;
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 22, paddingBottom: 35 }, back: { width: 40, height: 40, borderRadius: 15, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }, status: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 }, reference: { fontSize: 10, color: colors.muted }, card: { marginTop: 15 }, detail: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 10 }, detailLabel: { color: colors.muted, fontSize: 11 }, detailValue: { color: colors.ink, fontSize: 11, textAlign: 'right', flexShrink: 1 }, strong: { fontWeight: '700', fontSize: 13 }, divider: { height: 1, backgroundColor: colors.line }, payment: { color: colors.muted, fontSize: 10, marginTop: 8 }, cancel: { marginTop: 20, minHeight: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.terracotta }, cancelText: { color: colors.terracotta, fontWeight: '700', fontSize: 13 }, error: { color: colors.terracotta, fontSize: 11, marginTop: 15 } });

