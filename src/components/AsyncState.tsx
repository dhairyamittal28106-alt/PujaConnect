import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';

export function ModeNotice({ demo }: { demo: boolean }) {
  return <View style={[s.notice, demo ? s.demo : s.live]}><Feather name={demo ? 'info' : 'check-circle'} size={13} color={demo ? colors.terracotta : colors.sage} /><Text style={[s.noticeText, demo ? s.demoText : s.liveText]}>{demo ? 'Demo catalogue · sample data, no live marketplace' : 'Live catalogue · current marketplace records'}</Text></View>;
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return <View style={s.state}><ActivityIndicator color={colors.terracotta} /><Text style={s.body}>{label}</Text></View>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <View style={s.state}><Feather name="alert-circle" size={22} color={colors.terracotta} /><Text style={s.body}>{message}</Text>{onRetry ? <Pressable onPress={onRetry}><Text style={s.retry}>Try again</Text></Pressable> : null}</View>;
}

const s = StyleSheet.create({ notice: { flexDirection: 'row', gap: 7, alignItems: 'center', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 12, marginTop: 13 }, demo: { backgroundColor: colors.terracottaSoft }, live: { backgroundColor: colors.sageSoft }, noticeText: { fontSize: 10, flex: 1 }, demoText: { color: colors.terracotta }, liveText: { color: colors.sage }, state: { alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, minHeight: 130 }, body: { color: colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 }, retry: { color: colors.terracotta, fontSize: 12, fontWeight: '700', padding: 8 } });
