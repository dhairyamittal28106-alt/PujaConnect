import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthProvider';
import { ErrorState, LoadingState, ModeNotice } from '@/components/AsyncState';
import { Heading, Label, Pill, Surface } from '@/components/ui';
import type { BookingView, Mode } from '@/services/marketplace';
import { getCustomerBookings } from '@/services/marketplace';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors } from '@/theme/tokens';

const tabs = ['Upcoming', 'Completed', 'Cancelled'] as const;
type Tab = typeof tabs[number];

export default function BookingsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>('Upcoming');
  const [bookings, setBookings] = useState<BookingView[]>([]);
  const [mode, setMode] = useState<Mode>('demo');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!isSupabaseConfigured || !session) {
      setBookings([]);
      setMode('demo');
      setLoading(false);
      return;
    }
    try {
      const result = await getCustomerBookings(session.user.id);
      setBookings(result.data);
      setMode(result.mode);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'We could not load your bookings.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const visible = useMemo(() => bookings.filter(booking => {
    if (tab === 'Upcoming') return ['requested', 'accepted'].includes(booking.status);
    if (tab === 'Completed') return booking.status === 'completed';
    return ['cancelled', 'declined'].includes(booking.status);
  }), [bookings, tab]);

  return <SafeAreaView style={s.safe} edges={['top']}><ScrollView contentContainerStyle={s.content}><Label>YOUR RITUALS</Label><Heading style={{ marginTop: 7 }}>My bookings</Heading><Text style={s.sub}>Your plans, all in one place.</Text>{!loading && !error ? <ModeNotice demo={mode === 'demo'} /> : null}<View style={s.tabs}>{tabs.map(item => <Pressable key={item} onPress={() => setTab(item)} style={[s.tab, tab === item && s.active]}><Text style={[s.tabText, tab === item && s.activeText]}>{item}</Text></Pressable>)}</View>{loading ? <LoadingState label="Loading your bookings…" /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : visible.length ? visible.map(booking => <Pressable key={booking.id} onPress={() => router.push({ pathname: '/booking/[id]', params: { id: booking.id } })}><Surface style={s.booking}><View style={s.bookingIcon}><Feather name="sun" size={17} color={colors.terracotta} /></View><View style={{ flex: 1 }}><Text style={s.title}>{booking.service_name}</Text><Text style={s.sub}>{new Date(booking.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</Text><View style={s.meta}><Pill tone={booking.status === 'accepted' ? 'sage' : booking.status === 'requested' ? 'warm' : 'plain'}>{booking.status}</Pill><Text style={s.price}>₹{booking.total_price.toLocaleString('en-IN')}</Text></View></View><Feather name="chevron-right" size={17} color={colors.muted} /></Surface></Pressable>) : <View style={s.empty}><View style={s.emptyIcon}><Feather name="calendar" size={22} color={colors.sage} /></View><Text style={s.emptyTitle}>{mode === 'demo' && !session ? 'Sign in to see your bookings' : `No ${tab.toLowerCase()} bookings`}</Text><Text style={s.sub}>{mode === 'demo' ? 'Demo mode does not save bookings. Sign in after configuring Supabase to view real requests.' : 'Your booking updates will appear here.'}</Text>{mode === 'demo' && !session ? <Pressable onPress={() => router.push('/auth')}><Text style={s.link}>Sign in with phone</Text></Pressable> : null}</View>}</ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 22, paddingBottom: 35 }, sub: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 6 }, tabs: { flexDirection: 'row', backgroundColor: '#EEE9DF', borderRadius: 14, padding: 4, marginTop: 20 }, tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11 }, active: { backgroundColor: '#FFFFFF' }, tabText: { color: colors.muted, fontSize: 10 }, activeText: { color: colors.ink, fontWeight: '700' }, empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 15 }, emptyIcon: { width: 60, height: 60, backgroundColor: colors.sageSoft, borderRadius: 21, justifyContent: 'center', alignItems: 'center' }, emptyTitle: { color: colors.ink, fontSize: 15, fontWeight: '700', marginTop: 16 }, booking: { flexDirection: 'row', gap: 12, marginTop: 14, alignItems: 'center' }, bookingIcon: { width: 41, height: 41, borderRadius: 14, backgroundColor: colors.terracottaSoft, justifyContent: 'center', alignItems: 'center' }, title: { color: colors.ink, fontSize: 13, fontWeight: '700', marginBottom: 3 }, note: { color: colors.muted, fontSize: 9, textAlign: 'center', marginTop: 28 }, meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }, price: { color: colors.ink, fontSize: 11, fontWeight: '700' }, link: { color: colors.terracotta, fontSize: 12, fontWeight: '700', padding: 8 } });
