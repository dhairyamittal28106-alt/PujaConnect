import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heading, Label, Pill, Surface } from '@/components/ui';
import { ErrorState, LoadingState, ModeNotice } from '@/components/AsyncState';
import type { Pandit } from '@/data/catalog';
import { getPandit } from '@/services/marketplace';
import { colors } from '@/theme/tokens';

export default function PanditScreen() {
  const { id = '', service } = useLocalSearchParams<{ id: string; service?: string }>();
  const router = useRouter();
  const [pandit, setPandit] = useState<Pandit | null>(null);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getPandit(id);
        if (active) {
          setPandit(result.data);
          setDemo(result.mode === 'demo');
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'We could not load this pandit profile.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [id]);

  function continueToBooking() {
    const serviceId = service || pandit?.serviceIds?.[0];
    if (serviceId) router.push({ pathname: '/booking', params: { puja: serviceId, pandit: id } });
    else router.push('/(tabs)/explore');
  }

  return <SafeAreaView style={s.safe} edges={['top']}><ScrollView contentContainerStyle={s.content}><Pressable onPress={() => router.back()} style={s.back}><Feather name="arrow-left" size={19} color={colors.ink} /></Pressable>{loading ? <LoadingState label="Loading pandit profile…" /> : error ? <ErrorState message={error} /> : !pandit ? <View style={s.missing}><Heading>This profile is unavailable</Heading><Text style={s.copy}>Only active, verified pandit profiles are shown here.</Text></View> : <><View style={s.profile}><View style={s.avatar}><Feather name="user" size={34} color={colors.sage} /></View><Heading style={{ marginTop: 14 }}>{pandit.name}</Heading><Text style={s.experience}>{pandit.experience}</Text><View style={s.tags}><Pill tone={demo ? 'warm' : 'sage'}>{demo ? 'Sample profile' : 'Verified pandit'}</Pill>{demo && pandit.rating ? <Pill tone="plain">★ {pandit.rating} · {pandit.reviews} sample ratings</Pill> : null}</View></View>{demo ? <ModeNotice demo /> : null}<Surface style={s.card}><Label>ABOUT</Label><Text style={s.bio}>{pandit.bio || 'No biography has been added yet.'}</Text></Surface><View style={s.section}><Label>LANGUAGES</Label><View style={s.tags}>{pandit.languages.length ? pandit.languages.map(language => <Pill key={language} tone="plain">{language}</Pill>) : <Text style={s.copy}>Not specified</Text>}</View></View><View style={s.section}><Label>SPECIALISATIONS</Label>{pandit.specialities.length ? pandit.specialities.map(item => <View key={item} style={s.line}><Feather name="check" size={14} color={colors.sage} /><Text style={s.copy}>{item}</Text></View>) : <Text style={s.copy}>No service specialisations listed yet.</Text>}</View><View style={s.section}><Label>LOCATION & SERVICE AREA</Label><View style={s.line}><Feather name="map-pin" size={15} color={colors.terracotta} /><Text style={s.copy}>{pandit.location || 'Not specified'}</Text></View></View>{demo && pandit.price > 0 ? <Surface style={s.card}><Label>SAMPLE PRICING</Label><Text style={s.price}>Indicative dakshina from ₹{pandit.price.toLocaleString('en-IN')}</Text><Text style={s.copy}>This is sample information and not a quote.</Text></Surface> : null}</>}</ScrollView>{pandit ? <View style={s.footer}><Text style={s.sample}>{demo ? 'Sample profile · not verified' : 'Verified public profile'}</Text><Pressable onPress={continueToBooking} style={s.button}><Text style={s.buttonText}>{pandit.serviceIds?.length ? 'Request a booking' : 'Explore pujas'}</Text></Pressable></View> : null}</SafeAreaView>;
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 22, paddingBottom: 30 }, back: { width: 40, height: 40, borderRadius: 15, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }, profile: { alignItems: 'center', marginTop: 20, marginBottom: 24 }, avatar: { width: 104, height: 104, borderRadius: 34, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' }, experience: { color: colors.muted, fontSize: 12, marginTop: 6 }, tags: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 12 }, card: { marginBottom: 18 }, bio: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 9 }, section: { marginBottom: 22 }, line: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10 }, copy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 7 }, price: { marginTop: 13, color: colors.ink, fontSize: 13, fontWeight: '700' }, footer: { backgroundColor: '#FFFFFF', padding: 16, paddingHorizontal: 22, borderTopWidth: 1, borderColor: colors.line, gap: 8 }, sample: { color: colors.muted, fontSize: 10 }, button: { height: 50, backgroundColor: colors.terracotta, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' }, missing: { padding: 30, marginTop: 30 } });
