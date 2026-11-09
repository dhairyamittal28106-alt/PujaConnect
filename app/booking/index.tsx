import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthProvider';
import { Heading, Label, PrimaryButton, Surface } from '@/components/ui';
import { ErrorState, LoadingState, ModeNotice } from '@/components/AsyncState';
import type { Puja } from '@/data/catalog';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createBooking, getPuja } from '@/services/marketplace';
import { colors } from '@/theme/tokens';

const slots = ['10:00 AM', '1:00 PM', '4:00 PM'];

function dateChoices() {
  return [1, 2, 3].map(offset => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return { value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`, label: date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) };
  });
}

export default function BookingScreen() {
  const { puja: pujaId, pandit: panditId } = useLocalSearchParams<{ puja?: string; pandit?: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const dates = useMemo(dateChoices, []);
  const [puja, setPuja] = useState<Puja | null>(null);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [day, setDay] = useState(dates[0]?.value ?? '');
  const [slot, setSlot] = useState(slots[0]);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [language, setLanguage] = useState('');
  const [samagri, setSamagri] = useState(false);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const steps = ['Date & time', 'Your address', 'Preferences', 'Review'];

  useEffect(() => {
    let active = true;
    async function load() {
      if (!pujaId) {
        setLoading(false);
        setError('Choose a puja service before starting a booking request.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await getPuja(pujaId);
        if (active) {
          setPuja(result.data);
          setDemo(result.mode === 'demo');
          if (result.data) setLanguage(result.data.languages[0] ?? '');
          if (!result.data) setError('This puja is unavailable. Browse active services and try again.');
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'We could not load this service.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [pujaId]);

  const total = (puja?.price ?? 0) + (samagri ? puja?.samagriPrice ?? 0 : 0);
  const addressValid = address.trim().length >= 3 && city.trim().length > 0 && postalCode.trim().length >= 3;

  function getScheduledAt() {
    const [year, month, date] = day.split('-').map(Number);
    const [time, period] = slot.split(' ');
    const [rawHour, minute] = time.split(':').map(Number);
    let hour = rawHour % 12;
    if (period === 'PM') hour += 12;
    return new Date(year, month - 1, date, hour, minute).toISOString();
  }

  async function submitRequest() {
    if (!puja) return;
    setMessage(null);
    if (demo) {
      router.push({ pathname: '/booking/confirmation', params: { mode: 'demo' } });
      return;
    }
    if (!session) {
      const returnTo = `/booking?puja=${encodeURIComponent(puja.id)}${panditId ? `&pandit=${encodeURIComponent(panditId)}` : ''}`;
      router.push({ pathname: '/auth', params: { returnTo } });
      return;
    }
    setBusy(true);
    try {
      const booking = await createBooking({ serviceId: puja.id, scheduledAt: getScheduledAt(), address: address.trim(), city: city.trim(), postalCode: postalCode.trim(), preferredLanguage: language, notes, samagriIncluded: samagri, panditUserId: panditId ?? null });
      if (!booking) throw new Error('The request was not saved. Please try again.');
      router.replace({ pathname: '/booking/confirmation', params: { id: booking.id, mode: 'live' } });
    } catch (createError) {
      setMessage(createError instanceof Error ? createError.message : 'We could not create your request. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return <SafeAreaView style={s.safe} edges={['top']}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Pressable onPress={() => step ? setStep(step - 1) : router.back()} style={s.back}><Feather name="arrow-left" size={19} color={colors.ink} /></Pressable>{loading ? <LoadingState label="Loading booking details…" /> : error ? <ErrorState message={error} onRetry={() => router.replace('/(tabs)/explore')} /> : puja ? <><Label>BOOK A PUJA · STEP {step + 1} OF 4</Label><Heading style={{ marginTop: 6 }}>{steps[step]}</Heading><ModeNotice demo={demo} /><View style={s.progress}>{steps.map((_, index) => <View key={index} style={[s.bar, index <= step && s.barActive]} />)}</View><Surface style={s.summary}><View style={s.icon}><Feather name="sun" size={18} color={colors.terracotta} /></View><View style={{ flex: 1 }}><Text style={s.summaryTitle}>{puja.name}</Text><Text style={s.summarySub}>{demo ? 'Sample listing' : 'Current catalogue listing'} · from ₹{puja.price.toLocaleString('en-IN')}</Text></View></Surface>{step === 0 ? <><Text style={s.sectionTitle}>Choose a day</Text><View style={s.options}>{dates.map(item => <Choice key={item.value} text={item.label} selected={day === item.value} onPress={() => setDay(item.value)} />)}</View><Text style={s.sectionTitle}>Available times</Text><View style={s.options}>{slots.map(item => <Choice key={item} text={item} selected={slot === item} onPress={() => setSlot(item)} />)}</View><Text style={s.helper}>These are requested preferences. A pandit must accept before a booking is confirmed.</Text></> : null}{step === 1 ? <><Text style={s.sectionTitle}>Where should the ceremony take place?</Text><Text style={s.helper}>Your address is private and visible only to you and an assigned pandit.</Text><TextInput value={address} onChangeText={setAddress} placeholder="House / flat, street, area" multiline style={s.address} placeholderTextColor={colors.muted} /><TextInput value={city} onChangeText={setCity} placeholder="City" style={s.input} placeholderTextColor={colors.muted} /><TextInput value={postalCode} onChangeText={setPostalCode} placeholder="Postal code" keyboardType="number-pad" style={s.input} placeholderTextColor={colors.muted} /></> : null}{step === 2 ? <><Text style={s.sectionTitle}>Preferred language</Text><View style={s.options}>{puja.languages.length ? puja.languages.map(item => <Choice key={item} text={item} selected={language === item} onPress={() => setLanguage(item)} />) : <Text style={s.helper}>No language preferences have been listed. You can clarify in your notes.</Text>}</View><Text style={s.sectionTitle}>Samagri package</Text><Choice text={puja.samagriPrice > 0 ? `Include samagri · ₹${puja.samagriPrice.toLocaleString('en-IN')}` : 'No samagri package listed'} selected={samagri} onPress={() => setSamagri(!samagri)} /><TextInput value={notes} onChangeText={setNotes} placeholder="Special instructions (optional)" style={s.input} placeholderTextColor={colors.muted} /></> : null}{step === 3 ? <><Text style={s.sectionTitle}>Review your request</Text><Surface style={s.review}>{[['Puja', puja.name], ['Date', dates.find(item => item.value === day)?.label ?? day], ['Time', slot], ['Address', `${address}, ${city} ${postalCode}`], ['Language', language || 'Not specified'], ['Samagri', samagri ? 'Included' : 'Not included']].map(([key, value]) => <View key={key} style={s.reviewRow}><Text style={s.reviewKey}>{key}</Text><Text style={s.reviewValue}>{value}</Text></View>)}<View style={s.divider} /><View style={s.reviewRow}><Text style={s.reviewKey}>Puja service</Text><Text style={s.reviewValue}>₹{puja.price.toLocaleString('en-IN')}</Text></View>{samagri ? <View style={s.reviewRow}><Text style={s.reviewKey}>Samagri</Text><Text style={s.reviewValue}>₹{puja.samagriPrice.toLocaleString('en-IN')}</Text></View> : null}<View style={s.reviewRow}><Text style={s.totalLabel}>Total snapshot</Text><Text style={s.totalValue}>₹{total.toLocaleString('en-IN')}</Text></View></Surface><Text style={s.helper}>{demo ? 'Demo mode: this will open an unsubmitted request preview. No booking is created.' : 'Sending creates a request only. It is not confirmed until an assigned pandit accepts it. No payment is processed.'}</Text></> : null}{message ? <Text style={s.error}>{message}</Text> : null}</> : null}</ScrollView>{puja && !loading && !error ? <View style={s.footer}>{busy ? <View style={s.busy}><ActivityIndicator color={colors.terracotta} /><Text style={s.footerNote}>Sending booking request…</Text></View> : <PrimaryButton title={step === 3 ? demo ? 'Preview request' : session ? 'Send booking request' : 'Sign in to continue' : 'Continue'} onPress={() => step < 3 ? (step === 1 && !addressValid ? setMessage('Enter the address, city and postal code to continue.') : setStep(step + 1)) : void submitRequest()} disabled={step === 3 ? busy : step === 1 && !addressValid} />}<Text style={s.footerNote}>{demo ? 'Demo only · request is not sent' : session ? 'No payment taken · status will be requested' : 'Sign in is required to send a booking request'}</Text></View> : null}</SafeAreaView>;
}

function Choice({ text, selected, onPress }: { text: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[s.choice, selected && s.choiceSelected]}><Text style={[s.choiceText, selected && s.choiceTextSelected]}>{text}</Text>{selected ? <Feather name="check-circle" size={14} color={colors.terracotta} /> : null}</Pressable>;
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 22, paddingBottom: 28 }, back: { width: 40, height: 40, borderRadius: 15, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 18 }, progress: { flexDirection: 'row', gap: 5, marginTop: 20 }, bar: { flex: 1, height: 4, backgroundColor: colors.line, borderRadius: 4 }, barActive: { backgroundColor: colors.terracotta }, summary: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, padding: 13 }, icon: { width: 39, height: 39, borderRadius: 13, backgroundColor: colors.terracottaSoft, alignItems: 'center', justifyContent: 'center' }, summaryTitle: { color: colors.ink, fontSize: 12, fontWeight: '700' }, summarySub: { color: colors.muted, fontSize: 10, marginTop: 4 }, sectionTitle: { color: colors.ink, fontSize: 14, fontWeight: '700', marginTop: 26, marginBottom: 12 }, options: { gap: 8 }, choice: { minHeight: 47, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, choiceSelected: { borderColor: colors.terracotta, backgroundColor: '#FBF5F2' }, choiceText: { color: colors.ink, fontSize: 12 }, choiceTextSelected: { color: colors.terracotta, fontWeight: '700' }, helper: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 9 }, address: { minHeight: 96, textAlignVertical: 'top', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 14, color: colors.ink, marginTop: 5 }, input: { minHeight: 50, marginTop: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, borderRadius: 15, paddingHorizontal: 14, color: colors.ink }, review: { marginTop: 8 }, reviewRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, paddingVertical: 9 }, reviewKey: { color: colors.muted, fontSize: 11 }, reviewValue: { color: colors.ink, fontSize: 11, fontWeight: '600', flexShrink: 1, textAlign: 'right' }, totalLabel: { color: colors.ink, fontSize: 12, fontWeight: '700' }, totalValue: { color: colors.ink, fontSize: 12, fontWeight: '700' }, divider: { height: 1, backgroundColor: colors.line, marginVertical: 7 }, footer: { padding: 18, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: colors.line }, footerNote: { color: colors.muted, fontSize: 9, textAlign: 'center', marginTop: 9 }, busy: { minHeight: 54, justifyContent: 'center', alignItems: 'center', gap: 4 }, error: { color: colors.terracotta, fontSize: 11, lineHeight: 17, marginTop: 15 } });
