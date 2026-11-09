import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/theme/tokens';

const icons = { index: 'home', explore: 'search', bookings: 'calendar', profile: 'user' } as const;
export default function TabLayout() { return <Tabs screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.terracotta, tabBarInactiveTintColor: '#969087', tabBarStyle: { height: 86, paddingTop: 11, paddingBottom: 22, backgroundColor: '#FFFFFF', borderTopColor: colors.line }, tabBarLabelStyle: { fontSize: 10, fontWeight: '600' }, tabBarIcon: ({ color, size }) => <Feather name={icons[route.name as keyof typeof icons] || 'circle'} size={size} color={String(color ?? colors.muted)} /> })}><Tabs.Screen name="index" options={{ title: 'Home' }} /><Tabs.Screen name="explore" options={{ title: 'Explore' }} /><Tabs.Screen name="bookings" options={{ title: 'Bookings' }} /><Tabs.Screen name="profile" options={{ title: 'Profile' }} /></Tabs>; }


