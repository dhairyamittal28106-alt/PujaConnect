import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark, Heading, Label, Pill, SectionHeader, Surface } from '@/components/ui';
import { ErrorState, LoadingState, ModeNotice } from '@/components/AsyncState';
import type { Category, Mode as MarketplaceMode } from '@/services/marketplace';
import { getCategories, getPandits, getPujas } from '@/services/marketplace';
import type { Pandit, Puja } from '@/data/catalog';
import { colors } from '@/theme/tokens';

const categoryIcons = ['home', 'heart', 'sun', 'circle', 'wind', 'users', 'gift', 'grid'];

export default function HomeScreen() {
  const router = useRouter();
  const [pujas, setPujas] = useState<Puja[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pandits, setPandits] = useState<Pandit[]>([]);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pujaResult, categoryResult, panditResult] = await Promise.all([getPujas(), getCategories(), getPandits()]);
      setPujas(pujaResult.data);
      setCategories(categoryResult.data);
      setPandits(panditResult.data);
      setDemo(pujaResult.mode === 'demo');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'We could not load the catalogue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const featured = pujas[0];

  return <SafeAreaView style={s.safe} edges={['top']}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
    <View style={s.top}><View style={s.brandrow}><BrandMark size={38} /><View><Text style={s.brandname}>PujaConnect</Text><Text style={s.tagline}>Your traditions, thoughtfully taken care of.</Text></View></View><Pressable style={s.bell} onPress={() => router.push('/support')}><Feather name="help-circle" size={19} color={colors.ink} /></Pressable></View>
    <Pressable style={s.location} onPress={() => router.push('/(tabs)/explore')}><Feather name="map-pin" size={14} color={colors.terracotta} /><Text style={s.locationText}>EXPLORE BY LOCATION</Text><Feather name="chevron-down" size={14} color={colors.muted} /></Pressable>
    <View style={s.greet}><Text style={s.eyebrow}>A little more ease for your rituals</Text><Heading>Make room for{ '\n' }what matters.</Heading></View>
    <Pressable onPress={() => router.push('/(tabs)/explore')} style={s.search}><Feather name="search" size={18} color={colors.muted} /><Text style={s.searchText}>What would you like to arrange?</Text><Feather name="sliders" size={17} color={colors.terracotta} /></Pressable>
    {loading ? <LoadingState label="Finding ceremonies for you…" /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : featured ? <Pressable onPress={() => router.push(`/puja/${featured.id}`)} style={s.hero}>{featured.image ? <ImageBackground source={{ uri: featured.image }} imageStyle={s.heroImage} style={s.heroImage} /> : <View style={[s.heroImage, { backgroundColor: featured.accent }]} />}<View style={s.heroShade} /><View style={s.heroContent}><Pill tone="warm">{demo ? 'DEMO LISTING' : featured.category.toUpperCase()}</Pill><Text style={s.heroTitle}>{featured.name}</Text><Text style={s.heroSub}>{featured.description}</Text><View style={s.heroCta}><Text style={s.heroCtaText}>Explore this puja</Text><Feather name="arrow-up-right" size={15} color={colors.ink} /></View></View></Pressable> : <Surface style={s.empty}><Text style={s.cardTitle}>No pujas are listed yet</Text><Text style={s.cardSub}>Please check back after the catalogue is set up.</Text></Surface>}
    {!loading && !error ? <ModeNotice demo={demo} /> : null}
    <View style={s.section}><SectionHeader title="Find your ceremony" action="See all" onPress={() => router.push('/(tabs)/explore')} />{loading ? <LoadingState label="Loading categories…" /> : categories.length ? <View style={s.categoryGrid}>{categories.slice(0, 8).map((category, i) => <Pressable key={category.id} style={s.category} onPress={() => router.push({ pathname: '/(tabs)/explore', params: { categoryId: category.id } })}><View style={[s.categoryIcon, i % 2 === 0 ? s.iconSage : s.iconWarm]}><Feather name={categoryIcons[i % categoryIcons.length] as never} size={19} color={i % 2 === 0 ? colors.sage : colors.terracotta} /></View><Text style={s.categoryLabel}>{category.name}</Text></Pressable>)}</View> : <Text style={s.cardSub}>No active categories are available.</Text>}</View>
    <View style={s.section}><SectionHeader title="Ceremonies to explore" action="Explore" onPress={() => router.push('/(tabs)/explore')} />{loading ? <LoadingState label="Loading ceremonies…" /> : pujas.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.horizontal}>{pujas.slice(0, 4).map(puja => <Pressable key={puja.id} onPress={() => router.push(`/puja/${puja.id}`)} style={s.pujaCard}>{puja.image ? <ImageBackground source={{ uri: puja.image }} style={s.pujaImg} imageStyle={s.pujaImg}><>{demo && puja.rating ? <View style={s.rating}><Feather name="star" size={11} color={colors.gold} /><Text style={s.ratingText}>{puja.rating} sample</Text></View> : null}</></ImageBackground> : <View style={[s.pujaImg, s.imageFallback]}><Feather name="sun" size={24} color={colors.sage} /></View>}<Text style={s.cardTitle}>{puja.name}</Text><Text style={s.cardSub}>{puja.duration} · from ₹{puja.price.toLocaleString('en-IN')}</Text></Pressable>)}</ScrollView> : <Text style={s.cardSub}>There are no active puja services yet.</Text>}</View>
    <View style={s.section}><SectionHeader title={demo ? 'Sample pandit profiles' : 'Verified pandits'} action="Explore" onPress={() => router.push('/(tabs)/explore')} />{loading ? <LoadingState label="Loading pandit profiles…" /> : pandits.slice(0, 2).map(pandit => <Pressable key={pandit.id} onPress={() => router.push(`/pandit/${pandit.id}`)}><Surface style={s.pandit}>{pandit.image ? <ImageBackground source={{ uri: pandit.image }} style={s.avatar} imageStyle={s.avatar} /> : <View style={[s.avatar, s.avatarFallback]}><Feather name="user" size={20} color={colors.sage} /></View>}<View style={{ flex: 1 }}><Text style={s.cardTitle}>{pandit.name}</Text><Text style={s.cardSub}>{pandit.experience}</Text><View style={s.panditMeta}><Pill tone={demo ? 'warm' : 'sage'}>{demo ? 'Sample profile' : 'Verified pandit'}</Pill>{demo && pandit.rating ? <Text style={s.ratingText}>★ {pandit.rating} sample</Text> : null}</View></View><Feather name="chevron-right" size={18} color={colors.muted} /></Surface></Pressable>)}{!loading && !pandits.length ? <Text style={s.cardSub}>No verified pandits are available yet.</Text> : null}</View>
    <Surface style={s.occasion}><View style={s.occasionIcon}><Feather name="calendar" size={18} color={colors.terracotta} /></View><View style={{ flex: 1 }}><Label>PLAN A FAMILY OCCASION</Label><Text style={s.cardTitle}>Find a time that works</Text><Text style={s.cardSub}>Browse ceremonies and compare the details.</Text></View><Feather name="arrow-up-right" size={17} color={colors.terracotta} /></Surface>
    <Text style={s.disclaimer}>{demo ? 'Demo catalogue · sample profiles and indicative prices' : 'Live listings · availability is confirmed when you submit a request'}</Text>
  </ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { paddingHorizontal: 22, paddingBottom: 30 }, top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 7 }, brandrow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, brandname: { fontSize: 17, letterSpacing: -0.3, fontWeight: '700', color: colors.ink }, tagline: { fontSize: 9, color: colors.muted, marginTop: 2 }, bell: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }, location: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 21 }, locationText: { fontSize: 10, letterSpacing: 1.1, color: colors.ink, fontWeight: '700' }, greet: { marginTop: 23, gap: 7 }, eyebrow: { color: colors.sage, fontSize: 12, fontWeight: '600' }, search: { height: 53, paddingHorizontal: 15, marginTop: 18, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 10 }, searchText: { flex: 1, color: colors.muted, fontSize: 12 }, hero: { height: 208, marginTop: 21, overflow: 'hidden', borderRadius: 23, justifyContent: 'center' }, heroImage: { ...StyleSheet.absoluteFill }, heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(36,29,24,0.36)' }, heroContent: { paddingHorizontal: 21, paddingVertical: 18, gap: 8, alignItems: 'flex-start' }, heroTitle: { fontSize: 26, lineHeight: 30, color: '#FFFFFF', fontWeight: '600', letterSpacing: -0.6 }, heroSub: { color: '#F7F4EE', fontSize: 11, maxWidth: '88%' }, heroCta: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }, heroCtaText: { color: colors.ink, fontSize: 11, fontWeight: '700' }, section: { marginTop: 29 }, categoryGrid: { marginTop: 17, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 17 }, category: { width: '24%', alignItems: 'center', gap: 7 }, categoryIcon: { width: 51, height: 51, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, iconSage: { backgroundColor: colors.sageSoft }, iconWarm: { backgroundColor: colors.terracottaSoft }, categoryLabel: { color: colors.ink, fontSize: 9, textAlign: 'center', lineHeight: 12 }, horizontal: { gap: 12, paddingTop: 15 }, pujaCard: { width: 185 }, pujaImg: { width: 185, height: 112, borderRadius: 17, overflow: 'hidden' }, imageFallback: { backgroundColor: colors.sageSoft, justifyContent: 'center', alignItems: 'center' }, rating: { position: 'absolute', top: 9, right: 9, backgroundColor: '#FFFFFF', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 9, flexDirection: 'row', gap: 4, alignItems: 'center' }, ratingText: { color: colors.ink, fontSize: 10, fontWeight: '700' }, cardTitle: { color: colors.ink, fontSize: 13, fontWeight: '700', marginTop: 9 }, cardSub: { color: colors.muted, fontSize: 10, marginTop: 4, lineHeight: 15 }, pandit: { marginTop: 14, flexDirection: 'row', gap: 13, alignItems: 'center', padding: 12 }, avatar: { width: 57, height: 57, borderRadius: 17, overflow: 'hidden' }, avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sageSoft }, panditMeta: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 8 }, occasion: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }, occasionIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.terracottaSoft, justifyContent: 'center', alignItems: 'center' }, disclaimer: { fontSize: 9, color: colors.muted, textAlign: 'center', marginTop: 22 }, empty: { marginTop: 18 } });

