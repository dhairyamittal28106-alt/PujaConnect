import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthProvider';
import { BrandMark, Heading, Label, Surface } from '@/components/ui';
import { ErrorState, ModeNotice } from '@/components/AsyncState';
import type { UserProfile } from '@/services/marketplace';
import { getMyPanditProfile, getUserProfile, updateUserProfile } from '@/services/marketplace';
import { signOut } from '@/services/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors } from '@/theme/tokens';

const options = [{ icon: 'map-pin', title: 'Saved addresses', detail: 'Add an address during booking' }, { icon: 'globe', title: 'Language preference', detail: 'Choose for each ceremony' }, { icon: 'bell', title: 'Notifications', detail: 'Booking updates from Supabase' }, { icon: 'help-circle', title: 'Help & support', detail: 'FAQs and contact' }, { icon: 'file-text', title: 'Terms & privacy', detail: 'How PujaConnect works' }];

export default function ProfileScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pandit, setPandit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !isSupabaseConfigured) {
      setProfile(null);
      setPandit(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [profileResult, panditProfile] = await Promise.all([getUserProfile(session.user.id), getMyPanditProfile(session.user.id)]);
      setProfile(profileResult.data);
      setName(profileResult.data?.full_name ?? '');
      setPandit(Boolean(panditProfile));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'We could not load your profile.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  async function saveName() {
    if (!session || !name.trim()) return;
    setBusy(true);
    setNotice(null);
    setError(null);
    try {
      const saved = await updateUserProfile(session.user.id, name);
      if (!saved) throw new Error('Your profile update was not returned by Supabase.');
      setProfile(saved);
      setName(saved.full_name ?? '');
      setEditing(false);
      setNotice('Your name was updated.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'We could not save your profile.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    setError(null);
    try {
      await signOut();
      setProfile(null);
      setPandit(false);
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'We could not sign out.');
    } finally {
      setBusy(false);
    }
  }

  return <SafeAreaView style={s.safe} edges={['top']}><ScrollView contentContainerStyle={s.content}><Label>YOUR ACCOUNT</Label><Heading style={{ marginTop: 7 }}>Profile</Heading>{!isSupabaseConfigured ? <ModeNotice demo /> : null}{loading ? <View style={s.loading}><ActivityIndicator color={colors.terracotta} /></View> : null}<Surface style={s.account}><View style={s.avatar}><Feather name="user" size={22} color={colors.sage} /></View><View style={{ flex: 1 }}>{editing ? <TextInput value={name} onChangeText={setName} placeholder="Your full name" style={s.nameInput} placeholderTextColor={colors.muted} /> : <Text style={s.name}>{profile?.full_name || (session ? 'Your PujaConnect account' : 'Welcome to PujaConnect')}</Text>}<Text style={s.sub}>{profile?.phone || session?.user.phone || 'Browsing as a guest'}</Text></View>{session ? <Pressable onPress={() => editing ? void saveName() : setEditing(true)} disabled={busy}><Text style={s.signin}>{busy ? 'Saving…' : editing ? 'Save' : 'Edit'}</Text></Pressable> : <Pressable onPress={() => router.push('/auth')}><Text style={s.signin}>Sign in</Text></Pressable>}</Surface>{error ? <ErrorState message={error} onRetry={() => void load()} /> : null}{notice ? <Text style={s.notice}>{notice}</Text> : null}{pandit ? <Pressable onPress={() => router.push('/pandit-bookings')}><Surface style={s.dashboard}><View style={s.dashboardIcon}><Feather name="briefcase" size={17} color={colors.sage} /></View><View style={{ flex: 1 }}><Text style={s.optionTitle}>Pandit dashboard</Text><Text style={s.sub}>View assigned booking requests</Text></View><Feather name="chevron-right" size={17} color={colors.muted} /></Surface></Pressable> : null}{session && !pandit && isSupabaseConfigured ? <Pressable onPress={() => router.push('/pandit-profile')}><Surface style={s.dashboard}><View style={s.dashboardIcon}><Feather name="user-plus" size={17} color={colors.sage} /></View><View style={{ flex: 1 }}><Text style={s.optionTitle}>Create a pandit profile</Text><Text style={s.sub}>Apply for verification and list your services</Text></View><Feather name="chevron-right" size={17} color={colors.muted} /></Surface></Pressable> : null}<View style={s.group}>{options.map((option, index) => <Pressable key={option.title} onPress={() => option.title === 'Help & support' ? router.push('/support') : undefined} style={[s.option, index < options.length - 1 && s.border]}><View style={s.optionIcon}><Feather name={option.icon as never} size={16} color={colors.terracotta} /></View><View style={{ flex: 1 }}><Text style={s.optionTitle}>{option.title}</Text><Text style={s.sub}>{option.detail}</Text></View><Feather name="chevron-right" size={17} color={colors.muted} /></Pressable>)}</View>{session ? <Pressable onPress={() => void handleSignOut()} disabled={busy} style={s.signout}><Feather name="log-out" size={15} color={colors.terracotta} /><Text style={s.signoutText}>{busy ? 'Please wait…' : 'Sign out'}</Text></Pressable> : null}<View style={s.brand}><BrandMark size={31} /><View><Text style={s.brandName}>PujaConnect</Text><Text style={s.sub}>Your traditions, thoughtfully taken care of.</Text></View></View><Text style={s.version}>A preview experience · Version 1.0</Text></ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 22, paddingBottom: 35 }, account: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 17 }, avatar: { width: 45, height: 45, borderRadius: 16, backgroundColor: colors.sageSoft, justifyContent: 'center', alignItems: 'center' }, name: { color: colors.ink, fontSize: 12, fontWeight: '700' }, nameInput: { color: colors.ink, fontSize: 12, paddingVertical: 5, borderBottomWidth: 1, borderColor: colors.line }, sub: { color: colors.muted, fontSize: 10, marginTop: 4 }, signin: { color: colors.terracotta, fontSize: 11, fontWeight: '700' }, group: { marginTop: 17, paddingHorizontal: 14, backgroundColor: '#FFFFFF', borderRadius: 19, borderWidth: 1, borderColor: colors.line }, option: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 14 }, border: { borderBottomWidth: 1, borderBottomColor: colors.line }, optionIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.terracottaSoft, alignItems: 'center', justifyContent: 'center' }, optionTitle: { color: colors.ink, fontSize: 11, fontWeight: '600' }, brand: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 27 }, brandName: { color: colors.ink, fontSize: 13, fontWeight: '700' }, version: { color: colors.muted, fontSize: 9, marginTop: 15 }, dashboard: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 13 }, dashboardIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' }, loading: { padding: 12 }, notice: { color: colors.sage, fontSize: 11, marginTop: 10 }, signout: { flexDirection: 'row', alignItems: 'center', gap: 7, justifyContent: 'center', padding: 16 }, signoutText: { color: colors.terracotta, fontWeight: '700', fontSize: 12 } });
