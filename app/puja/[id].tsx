import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heading, Label, Pill, PrimaryButton, Surface } from '@/components/ui';
import { ErrorState, LoadingState, ModeNotice } from '@/components/AsyncState';
import type { Pandit, Puja } from '@/data/catalog';
import { getPandits, getPuja } from '@/services/marketplace';
import { colors } from '@/theme/tokens';

export default function PujaDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [puja, setPuja] = useState<Puja | null>(null);
  const [pandits, setPandits] = useState<Pandit[]>([]);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getPuja(id);
        if (!result.data) {
          if (active) setPuja(null);
          return;
        }
        const panditResult = await getPandits(result.data.id);
        if (active) {
          setPuja(result.data);
          setPandits(panditResult.data);
          setDemo(result.mode === 'demo');
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'We could not load this puja.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [id]);

  return <SafeAreaView style={s.safe} edges={['top']}><Pressable onPress={() => router.back()} style={s.back}><Feather name="arrow-left" size={19} color={colors.ink} /></Pressable>{loading ? <LoadingState label="Loading puja details…" /> : error ? <ErrorState message={error} /> : !puja ? <View style={s.missing}><Text style={s.heading}>This puja is unavailable</Text><Text style={s.copy}>It may have been removed or is no longer active.</Text></View> : <><ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}><View style={s.hero}>{puja.image ? <ImageBackground source={{ uri: puja.image }} style={StyleSheet.absoluteFill} imageStyle={s.heroImage} /> : <View style={[StyleSheet.absoluteFill, s.heroFallback]} />}<View style={s.heroShade} /><View style={s.heroBottom}><Pill tone="warm">{puja.category}</Pill><Heading style={s.heroTitle}>{puja.name}</Heading>{demo && puja.rating ? <Text style={s.heroMeta}>★ {puja.rating} · {puja.reviews} sample ratings · {puja.duration}</Text> : <Text style={s.heroMeta}>{puja.duration}</Text>}</View></View><View style={s.body}>{!demo ? <ModeNotice demo={false} /> : null}<Label>ABOUT THIS PUJA</Label><Text style={s.description}>{puja.description}</Text><Surface style={s.info}><Label>TRADITIONAL PURPOSE</Label><Text style={s.copy}>{puja.purpose || 'Purpose information has not been added yet.'}</Text></Surface><View style={s.row}><View style={s.stat}><Feather name="clock" size={16} color={colors.sage} /><Text style={s.statTitle}>Duration</Text><Text style={s.statText}>{puja.duration}</Text></View><View style={s.stat}><Feather name="message-circle" size={16} color={colors.sage} /><Text style={s.statTitle}>Languages</Text><Text style={s.statText}>{puja.languages.length ? puja.languages.join(', ') : 'Not specified'}</Text></View></View><Section title="What’s included" items={puja.included} /><Section title="Samagri & exclusions" items={[puja.samagri, ...puja.excluded]} /><Section title="Cancellation policy" items={[puja.cancellationPolicy]} /><Label>{demo ? 'SAMPLE PANDIT PROFILES' : 'VERIFIED PANDITS FOR THIS PUJA'}</Label>{pandits.map(pandit => <Pressable key={pandit.id} onPress={() => router.push({ pathname: '/pandit/[id]', params: { service: puja.id } })} style={s.pandit}><View style={s.panditIcon}><Feather name="user" size={16} color={colors.sage} /></View><View style={{ flex: 1 }}><Text style={s.panditName}>{pandit.name}</Text><Text style={s.statText}>{pandit.experience}{demo && pandit.rating ? ` · ★ ${pandit.rating} sample` : ''}</Text><Pill tone={demo ? 'warm' : 'sage'}>{demo ? 'Sample profile' : 'Verified pandit'}</Pill></View><Feather name="chevron-right" size={17} color={colors.muted} /></Pressable>)}{!pandits.length ? <Text style={s.copy}>{demo ? 'Sample profile data is unavailable.' : 'No verified pandits currently offer this puja.'}</Text> : null}</View></ScrollView><View style={s.footer}><View><Text style={s.from}>STARTING FROM</Text><Text style={s.amount}>₹{puja.price.toLocaleString('en-IN')}</Text></View><View style={{ flex: 1 }}><PrimaryButton title="Book this puja" onPress={() => router.push({ pathname: '/booking', params: { puja: puja.id } })} /></View></View></>}</SafeAreaView>;
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text>{items.map(item => <View key={item} style={s.bullet}><Feather name="check" size={13} color={colors.sage} /><Text style={s.copy}>{item}</Text></View>)}</View>;
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { paddingBottom: 24 }, back: { position: 'absolute', zIndex: 2, top: 12, left: 18, width: 40, height: 40, borderRadius: 15, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, hero: { height: 275, justifyContent: 'flex-end', overflow: 'hidden' }, heroImage: { resizeMode: 'cover' }, heroFallback: { backgroundColor: colors.sageSoft }, heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(28,25,22,0.46)' }, heroBottom: { paddingHorizontal: 22, paddingBottom: 20, gap: 8 }, heroTitle: { color: '#FFFFFF', fontSize: 27 }, heroMeta: { color: '#F7F4EE', fontSize: 11 }, body: { padding: 22 }, description: { color: colors.ink, fontSize: 14, lineHeight: 21, marginTop: 9 }, info: { marginTop: 17 }, copy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 7 }, row: { flexDirection: 'row', gap: 10, marginTop: 13 }, stat: { flex: 1, padding: 14, backgroundColor: '#FFFFFF', borderRadius: 17, borderWidth: 1, borderColor: colors.line }, statTitle: { color: colors.ink, fontSize: 11, fontWeight: '700', marginTop: 7 }, statText: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 }, section: { marginTop: 22, marginBottom: 22 }, sectionTitle: { fontSize: 15, color: colors.ink, fontWeight: '700', marginBottom: 5 }, bullet: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }, pandit: { marginTop: 12, padding: 13, borderRadius: 16, borderColor: colors.line, borderWidth: 1, backgroundColor: '#FFFFFF', flexDirection: 'row', gap: 11, alignItems: 'center' }, panditIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' }, panditName: { color: colors.ink, fontSize: 12, fontWeight: '700' }, footer: { flexDirection: 'row', gap: 18, padding: 16, paddingHorizontal: 22, alignItems: 'center', backgroundColor: '#FFFFFF', borderTopColor: colors.line, borderTopWidth: 1 }, from: { fontSize: 9, color: colors.muted, letterSpacing: 0.8 }, amount: { fontSize: 17, color: colors.ink, fontWeight: '700', marginTop: 3 }, missing: { flex: 1, justifyContent: 'center', padding: 30 }, heading: { color: colors.ink, fontSize: 19, fontWeight: '700' } });
