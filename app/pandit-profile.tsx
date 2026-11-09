import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthProvider';
import { ErrorState } from '@/components/AsyncState';
import { Heading, Label, Pill, PrimaryButton, Surface } from '@/components/ui';
import type { PanditProfileInput, PanditRow } from '@/services/marketplace';
import { createMyPanditProfile, getMyPanditProfile, updateMyPanditProfile } from '@/services/marketplace';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors } from '@/theme/tokens';

export default function PanditProfileScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [profile, setProfile] = useState<PanditRow | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('0');
  const [languages, setLanguages] = useState('');
  const [city, setCity] = useState('');
  const [serviceAreas, setServiceAreas] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!session || !isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      try {
        const result = await getMyPanditProfile(session.user.id);
        if (!active) return;
        setProfile(result);
        setDisplayName(result?.display_name ?? '');
        setBio(result?.bio ?? '');
        setExperience(String(result?.experience_years ?? 0));
        setLanguages(result?.languages.join(', ') ?? '');
        setCity(result?.city ?? '');
        setServiceAreas(result?.service_areas.join(', ') ?? '');
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'We could not load your pandit profile.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [session]);

  async function save() {
    if (!session) return;
    const years = Number(experience);
    if (!displayName.trim() || !city.trim() || !Number.isInteger(years) || years < 0 || years > 80) {
      setError('Enter a display name, city and a whole number of experience years from 0 to 80.');
      return;
    }
    setBusy(true);
    setError(null);
    const value: PanditProfileInput = { display_name: displayName.trim(), bio: bio.trim() || null, experience_years: years, languages: languages.split(',').map(item => item.trim()).filter(Boolean), city: city.trim(), service_areas: serviceAreas.split(',').map(item => item.trim()).filter(Boolean) };
    try {
      const result = profile ? await updateMyPanditProfile(session.user.id, value) : await createMyPanditProfile(session.user.id, value);
      setProfile(result);
      router.replace('/(tabs)/profile');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'We could not save your pandit profile.');
    } finally {
      setBusy(false);
    }
  }

  if (!session || !isSupabaseConfigured) return <SafeAreaView style={s.safe}><View style={s.content}><Pressable onPress={() => router.back()} style={s.back}><Feather name="arrow-left" size={19} color={colors.ink} /></Pressable><Heading>Create a pandit profile</Heading><Text style={s.help}>Sign in and configure Supabase to create a profile for review.</Text><PrimaryButton title="Sign in" onPress={() => router.push('/auth')} /></View></SafeAreaView>;

  return <SafeAreaView style={s.safe} edges={['top']}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Pressable onPress={() => router.back()} style={s.back}><Feather name="arrow-left" size={19} color={colors.ink} /></Pressable><Label>PANDIT PROFILE</Label><Heading style={{ marginTop: 7 }}>{profile ? 'Your public details' : 'Apply to join PujaConnect'}</Heading><Text style={s.help}>Your profile stays private until an administrator verifies it. You cannot change your own verification status.</Text>{profile ? <Surface style={s.status}><Label>VERIFICATION STATUS</Label><Pill tone={profile.verification_status === 'verified' ? 'sage' : 'warm'}>{profile.verification_status}</Pill></Surface> : null}{loading ? <ActivityIndicator color={colors.terracotta} /> : <><Field label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Name shown to customers" /><Field label="About your practice" value={bio} onChangeText={setBio} placeholder="A short introduction" multiline /><Field label="Years of experience" value={experience} onChangeText={value => setExperience(value.replace(/\D/g, '').slice(0, 2))} placeholder="0" keyboardType="number-pad" /><Field label="Languages" value={languages} onChangeText={setLanguages} placeholder="Hindi, Sanskrit, English" /><Field label="City" value={city} onChangeText={setCity} placeholder="Your city" /><Field label="Service areas" value={serviceAreas} onChangeText={setServiceAreas} placeholder="Areas separated by commas" /><Surface style={s.note}><Text style={s.noteText}>Puja service listings are added by an administrator. A profile remains pending until it is reviewed and approved.</Text></Surface></>}{error ? <ErrorState message={error} /> : null}<PrimaryButton title={busy ? 'Saving…' : profile ? 'Save profile' : 'Submit for review'} onPress={() => void save()} disabled={busy || loading} /></ScrollView></SafeAreaView>;
}

function Field({ label, value, onChangeText, placeholder, multiline, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean; keyboardType?: 'number-pad' }) {
  return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} multiline={multiline} keyboardType={keyboardType} style={[s.input, multiline && s.multiline]} /></View>;
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { flexGrow: 1, padding: 22, paddingBottom: 35, gap: 13 }, back: { width: 40, height: 40, borderRadius: 15, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }, help: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 }, status: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, field: { gap: 7 }, label: { color: colors.ink, fontSize: 11, fontWeight: '700' }, input: { minHeight: 49, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF', paddingHorizontal: 13, color: colors.ink, fontSize: 12 }, multiline: { minHeight: 90, textAlignVertical: 'top', paddingVertical: 12 }, note: { backgroundColor: colors.sageSoft }, noteText: { color: colors.sage, fontSize: 11, lineHeight: 17 } });
