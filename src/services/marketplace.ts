import { categories as demoCategories, pandits as demoPandits, pujas as demoPujas, type Pandit, type Puja } from '@/data/catalog';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

export type Mode = 'demo' | 'live';
type Result<T> = { data: T; mode: Mode };
type CategoryRow = Database['public']['Tables']['puja_categories']['Row'];
type ServiceRow = Database['public']['Tables']['puja_services']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type PanditRow = Database['public']['Tables']['pandit_profiles']['Row'];
type BookingRow = Database['public']['Tables']['bookings']['Row'];

export type BookingView = BookingRow & { service_name: string };
export type UserProfile = Pick<ProfileRow, 'user_id' | 'full_name' | 'phone' | 'avatar_url'>;
export type Category = Pick<CategoryRow, 'id' | 'name' | 'description' | 'image_url'>;
export type CreateBookingInput = {
  serviceId: string;
  scheduledAt: string;
  address: string;
  city: string;
  postalCode: string;
  preferredLanguage: string;
  notes?: string;
  samagriIncluded: boolean;
  panditUserId?: string | null;
};

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured. This action is unavailable in demo mode.');
  return supabase;
}

function checkError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours && remainingMinutes) return `${hours}h ${remainingMinutes}m`;
  if (hours) return `${hours}h`;
  return `${remainingMinutes}m`;
}

function mapService(service: ServiceRow, category: Category | undefined): Puja {
  return {
    id: service.id,
    name: service.name,
    category: category?.name ?? '',
    description: service.description,
    purpose: service.purpose ?? '',
    duration: formatDuration(service.duration_minutes),
    price: service.base_price,
    samagriPrice: service.samagri_price,
    image: category?.image_url,
    accent: '#EEE9DF',
    languages: service.languages,
    samagri: service.samagri_price > 0 ? `Optional samagri kit · ₹${service.samagri_price.toLocaleString('en-IN')}` : 'No samagri package listed',
    included: service.included,
    excluded: service.excluded,
    cancellationPolicy: service.cancellation_policy ?? 'Contact support for the current policy.',
    demo: false,
  };
}

export async function getCategories(): Promise<Result<Category[]>> {
  if (!isSupabaseConfigured) return { data: demoCategories.map((name, index) => ({ id: `demo-${index}`, name, description: null, image_url: null })), mode: 'demo' };
  const client = requireClient();
  const { data, error } = await client.from('puja_categories').select('id,name,description,image_url').eq('active', true).order('name');
  checkError(error);
  return { data: data ?? [], mode: 'live' };
}

export async function getPujas(categoryId?: string): Promise<Result<Puja[]>> {
  if (!isSupabaseConfigured) {
    const data = categoryId && categoryId.startsWith('demo-')
      ? demoPujas.filter(puja => `demo-${demoCategories.indexOf(puja.category)}` === categoryId)
      : categoryId ? [] : demoPujas;
    return { data, mode: 'demo' };
  }
  const client = requireClient();
  const [servicesResult, categoriesResult] = await Promise.all([
    client.from('puja_services').select('*').eq('active', true).order('name'),
    client.from('puja_categories').select('id,name,description,image_url').eq('active', true),
  ]);
  checkError(servicesResult.error);
  checkError(categoriesResult.error);
  const categoryMap = new Map((categoriesResult.data ?? []).map(row => [row.id, row]));
  const services = categoryId ? (servicesResult.data ?? []).filter(row => row.category_id === categoryId) : servicesResult.data ?? [];
  return { data: services.map(row => mapService(row, categoryMap.get(row.category_id))), mode: 'live' };
}

export async function getPuja(id: string): Promise<Result<Puja | null>> {
  if (!isSupabaseConfigured) return { data: demoPujas.find(puja => puja.id === id) ?? null, mode: 'demo' };
  const result = await getPujas();
  return { data: result.data.find(puja => puja.id === id) ?? null, mode: 'live' };
}

function mapPandit(row: PanditRow): Pandit {
  return {
    id: row.user_id,
    name: row.display_name,
    experience: `${row.experience_years} years of experience`,
    languages: row.languages,
    specialities: [],
    location: [row.city, ...row.service_areas].filter(Boolean).join(' · '),
    price: 0,
    bio: row.bio ?? '',
    demo: false,
  };
}

export async function getPandits(serviceId?: string): Promise<Result<Pandit[]>> {
  if (!isSupabaseConfigured) {
    const data = serviceId
      ? demoPandits.filter(pandit => pandit.specialities.some(speciality => demoPujas.some(puja => puja.id === serviceId && puja.name.toLowerCase().includes(speciality.toLowerCase()))))
      : demoPandits;
    return { data: data.map(pandit => ({ ...pandit, serviceIds: demoPujas.filter(puja => pandit.specialities.some(speciality => puja.name.toLowerCase().includes(speciality.toLowerCase()))).map(puja => puja.id) })), mode: 'demo' };
  }
  const client = requireClient();
  if (serviceId) {
    const { data: links, error: linkError } = await client.from('pandit_services').select('pandit_user_id').eq('service_id', serviceId);
    checkError(linkError);
    const userIds = [...new Set((links ?? []).map(link => link.pandit_user_id))];
    if (!userIds.length) return { data: [], mode: 'live' };
    const { data, error } = await client.from('pandit_profiles').select('*').in('user_id', userIds).eq('verification_status', 'verified').order('display_name');
    checkError(error);
    return { data: (data ?? []).map(mapPandit), mode: 'live' };
  }
  const { data, error } = await client.from('pandit_profiles').select('*').eq('verification_status', 'verified').order('display_name');
  checkError(error);
  return { data: (data ?? []).map(mapPandit), mode: 'live' };
}

export async function getPandit(id: string): Promise<Result<Pandit | null>> {
  if (!isSupabaseConfigured) {
    const pandit = demoPandits.find(item => item.id === id);
    return { data: pandit ? { ...pandit, serviceIds: demoPujas.filter(puja => pandit.specialities.some(speciality => puja.name.toLowerCase().includes(speciality.toLowerCase()))).map(puja => puja.id) } : null, mode: 'demo' };
  }
  const client = requireClient();
  const { data, error } = await client.from('pandit_profiles').select('*').eq('user_id', id).eq('verification_status', 'verified').maybeSingle();
  checkError(error);
  if (!data) return { data: null, mode: 'live' };
  const { data: links, error: linkError } = await client.from('pandit_services').select('service_id').eq('pandit_user_id', id);
  checkError(linkError);
  const serviceIds = (links ?? []).map(link => link.service_id);
  const { data: services, error: serviceError } = serviceIds.length ? await client.from('puja_services').select('id,name').in('id', serviceIds).eq('active', true) : { data: [], error: null };
  checkError(serviceError);
  return { data: { ...mapPandit(data), specialities: (services ?? []).map(service => service.name), serviceIds: (services ?? []).map(service => service.id) }, mode: 'live' };
}

export async function getMyPanditProfile(userId: string): Promise<PanditRow | null> {
  const client = requireClient();
  const { data, error } = await client.from('pandit_profiles').select('*').eq('user_id', userId).maybeSingle();
  checkError(error);
  return data;
}

export type PanditProfileInput = Pick<PanditRow, 'display_name' | 'bio' | 'experience_years' | 'languages' | 'city' | 'service_areas'>;

export async function createMyPanditProfile(userId: string, profile: PanditProfileInput) {
  const client = requireClient();
  const { data, error } = await client.from('pandit_profiles').insert({ user_id: userId, ...profile }).select('*').single();
  checkError(error);
  return data;
}

export async function updateMyPanditProfile(userId: string, profile: Partial<PanditProfileInput>) {
  const client = requireClient();
  const { data, error } = await client.from('pandit_profiles').update(profile).eq('user_id', userId).select('*').single();
  checkError(error);
  return data;
}

export async function getUserProfile(userId: string): Promise<Result<UserProfile | null>> {
  if (!isSupabaseConfigured) return { data: null, mode: 'demo' };
  const client = requireClient();
  const { data, error } = await client.from('profiles').select('user_id,full_name,phone,avatar_url').eq('user_id', userId).maybeSingle();
  checkError(error);
  return { data, mode: 'live' };
}

export async function updateUserProfile(userId: string, fullName: string) {
  const client = requireClient();
  const { data, error } = await client.from('profiles').update({ full_name: fullName.trim() }).eq('user_id', userId).select('user_id,full_name,phone,avatar_url').single();
  checkError(error);
  return data;
}

async function mapBookings(rows: BookingRow[]): Promise<BookingView[]> {
  if (!rows.length) return [];
  const client = requireClient();
  const serviceIds = [...new Set(rows.map(row => row.service_id))];
  const { data: services, error } = await client.from('puja_services').select('id,name').in('id', serviceIds);
  checkError(error);
  const names = new Map((services ?? []).map(service => [service.id, service.name]));
  return rows.map(row => ({ ...row, service_name: names.get(row.service_id) ?? 'Puja service' }));
}

export async function getCustomerBookings(userId: string): Promise<Result<BookingView[]>> {
  if (!isSupabaseConfigured) return { data: [], mode: 'demo' };
  const client = requireClient();
  const { data, error } = await client.from('bookings').select('*').eq('customer_id', userId).order('scheduled_at', { ascending: false });
  checkError(error);
  return { data: await mapBookings(data ?? []), mode: 'live' };
}

export async function getBooking(bookingId: string): Promise<BookingView | null> {
  const client = requireClient();
  const { data, error } = await client.from('bookings').select('*').eq('id', bookingId).maybeSingle();
  checkError(error);
  if (!data) return null;
  const [booking] = await mapBookings([data]);
  return booking ?? null;
}

export async function getAssignedBookings(userId: string): Promise<BookingView[]> {
  const client = requireClient();
  const { data, error } = await client.from('bookings').select('*').eq('pandit_user_id', userId).order('scheduled_at');
  checkError(error);
  return mapBookings(data ?? []);
}

export async function createBooking(input: CreateBookingInput) {
  const client = requireClient();
  const { data, error } = await client.rpc('create_booking', {
    p_service_id: input.serviceId,
    p_scheduled_at: input.scheduledAt,
    p_address: input.address,
    p_city: input.city,
    p_postal_code: input.postalCode,
    p_preferred_language: input.preferredLanguage || null,
    p_notes: input.notes || null,
    p_samagri_included: input.samagriIncluded,
    p_pandit_user_id: input.panditUserId ?? null,
  });
  checkError(error);
  return data;
}

export async function changeBookingStatus(action: 'accept_booking' | 'decline_booking' | 'cancel_booking' | 'complete_booking', bookingId: string) {
  const client = requireClient();
  const { data, error } = await client.rpc(action, { p_booking_id: bookingId });
  checkError(error);
  return data;
}

