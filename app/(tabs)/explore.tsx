import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heading, Label, Pill, Surface } from '@/components/ui';
import { ErrorState, LoadingState, ModeNotice } from '@/components/AsyncState';
import type { Pandit, Puja } from '@/data/catalog';
import { getCategories, getPandits, getPujas, type Category } from '@/services/marketplace';
import { colors } from '@/theme/tokens';

export default function ExploreScreen() {
  const router = useRouter();
  const { categoryId: initialCategoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId ?? null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pujas, setPujas] = useState<Puja[]>([]);
  const [pandits, setPandits] = useState<Pandit[]>([]);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [panditsLoading, setPanditsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panditError, setPanditError] = useState<string | null>(null);

  const loadCatalogue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoryResult, pujaResult] = await Promise.all([getCategories(), getPujas(categoryId ?? undefined)]);
      setCategories(categoryResult.data);
      setPujas(pujaResult.data);
      setDemo(pujaResult.mode === 'demo');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'We could not load puja services.');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => { void loadCatalogue(); }, [loadCatalogue]);
  useEffect(() => { if (initialCategoryId) setCategoryId(initialCategoryId); }, [initialCategoryId]);

  const results = useMemo(() => pujas.filter(puja => `${puja.name} ${puja.category}`.toLowerCase().includes(query.trim().toLowerCase())), [pujas, query]);
  const selectedServiceId = results[0]?.id;

  useEffect(() => {
    let active = true;
    async function loadPandits() {
      setPanditsLoading(true);
      setPanditError(null);
      try {
        const result = await getPandits(selectedServiceId);
        if (active) setPandits(result.data);
      } catch (loadError) {
        if (active) setPanditError(loadError instanceof Error ? loadError.message : 'We could not load pandit profiles.');
      } finally {
        if (active) setPanditsLoading(false);
      }
    }
    void loadPandits();
    return () => { active = false; };
  }, [selectedServiceId]);

  return <SafeAreaView style={s.safe} edges={['top']}><ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}><Label>DISCOVER WITH CARE</Label><Heading style={{ marginTop: 7 }}>Explore pujas</Heading><Text style={s.sub}>Find a ceremony that feels right for your family.</Text>{!loading && !error ? <ModeNotice demo={demo} /> : null}<View style={s.search}><Feather name="search" size={18} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Search pujas or ceremonies" placeholderTextColor={colors.muted} style={s.input} /><Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search"><Feather name={query ? 'x' : 'sliders'} size={18} color={colors.terracotta} /></Pressable></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}><Pressable onPress={() => setCategoryId(null)} style={[s.chip, !categoryId && s.activeChip]}><Text style={[s.chipText, !categoryId && s.activeText]}>All</Text></Pressable>{categories.map(category => <Pressable key={category.id} onPress={() => setCategoryId(categoryId === category.id ? null : category.id)} style={[s.chip, categoryId === category.id && s.activeChip]}><Text style={[s.chipText, categoryId === category.id && s.activeText]}>{category.name}</Text></Pressable>)}</ScrollView><View style={s.resultRow}><Text style={s.resultCount}>{loading ? 'Loading services…' : `${results.length} ${results.length === 1 ? 'ceremony' : 'ceremonies'}`}</Text><View style={s.sort}><Feather name="map-pin" size={13} color={colors.terracotta} /><Text style={s.sortText}>Service area</Text></View></View>{loading ? <LoadingState label="Loading puja services…" /> : error ? <ErrorState message={error} onRetry={() => void loadCatalogue()} /> : results.map(puja => <Pressable key={puja.id} onPress={() => router.push(`/puja/${puja.id}`)} style={s.card}>{puja.image ? <ImageBackground source={{ uri: puja.image }} style={s.image} imageStyle={s.image}>{demo && puja.rating ? <View style={s.rating}><Text style={s.ratingText}>★ {puja.rating} sample</Text></View> : null}</ImageBackground> : <View style={[s.image, s.imageFallback]}><Feather name="sun" size={24} color={colors.sage} /></View>}<View style={s.cardCopy}><View style={s.titleRow}><Text style={s.name}>{puja.name}</Text><Feather name="arrow-up-right" size={17} color={colors.terracotta} /></View><Text style={s.description} numberOfLines={2}>{puja.description}</Text><View style={s.meta}><Pill>{puja.duration}</Pill><Text style={s.price}>From ₹{puja.price.toLocaleString('en-IN')}</Text></View></View></Pressable>)}{!loading && !error && results.length === 0 ? <View style={s.empty}><Feather name="search" size={24} color={colors.sage} /><Text style={s.emptyTitle}>No ceremonies found</Text><Text style={s.sub}>Try another name or browse all active services.</Text></View> : null}<View style={s.panditSection}><Text style={s.panditHeading}>{demo ? 'Sample pandit profiles' : 'Verified pandits'}</Text><Text style={s.sub}>{selectedServiceId ? `Profiles offering ${results[0]?.name}` : 'Profiles currently offering listed services'}</Text>{panditsLoading ? <LoadingState label="Finding matching pandits…" /> : panditError ? <ErrorState message={panditError} /> : pandits.length ? pandits.map(pandit => <Pressable key={pandit.id} onPress={() => router.push(`/pandit/${pandit.id}`)}><Surface style={s.pandit}><View style={s.panditIcon}><Feather name="user" size={17} color={colors.sage} /></View><View style={{ flex: 1 }}><Text style={s.name}>{pandit.name}</Text><Text style={s.description}>{pandit.experience} · {pandit.location}</Text><Pill tone={demo ? 'warm' : 'sage'}>{demo ? 'Sample profile' : 'Verified pandit'}</Pill></View><Feather name="chevron-right" size={17} color={colors.muted} /></Surface></Pressable>) : <Text style={s.sub}>{demo ? 'Sample profiles only; no verification or actual availability is implied.' : 'No verified pandits are listed for this service yet.'}</Text>}</View></ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 22, paddingBottom: 35 }, sub: { fontSize: 12, color: colors.muted, marginTop: 8, lineHeight: 18 }, search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, borderRadius: 16, height: 52, marginTop: 18, paddingHorizontal: 14 }, input: { flex: 1, color: colors.ink, fontSize: 12 }, filters: { gap: 8, paddingVertical: 16 }, chip: { borderRadius: 20, borderColor: colors.line, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: '#FFFFFF' }, activeChip: { backgroundColor: colors.ink, borderColor: colors.ink }, chipText: { color: colors.muted, fontSize: 11 }, activeText: { color: '#FFFFFF', fontWeight: '600' }, resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 3 }, resultCount: { color: colors.ink, fontSize: 12, fontWeight: '700' }, sort: { flexDirection: 'row', gap: 5, alignItems: 'center' }, sortText: { color: colors.ink, fontSize: 10 }, card: { marginTop: 14, backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.line }, image: { height: 145, justifyContent: 'flex-start', alignItems: 'flex-end', padding: 12 }, imageFallback: { backgroundColor: colors.sageSoft, justifyContent: 'center', alignItems: 'center' }, rating: { backgroundColor: '#FFFFFF', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5 }, ratingText: { fontSize: 10, color: colors.ink, fontWeight: '700' }, cardCopy: { padding: 14 }, titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, name: { color: colors.ink, fontSize: 15, fontWeight: '700' }, description: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 7 }, meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 13 }, price: { color: colors.ink, fontSize: 11, fontWeight: '700' }, empty: { alignItems: 'center', marginTop: 55, gap: 10 }, emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' }, panditSection: { marginTop: 28 }, panditHeading: { color: colors.ink, fontSize: 19, fontWeight: '700' }, pandit: { marginTop: 12, padding: 13, flexDirection: 'row', gap: 11, alignItems: 'center' }, panditIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.sageSoft, justifyContent: 'center', alignItems: 'center' } });
