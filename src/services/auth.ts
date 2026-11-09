import { supabase } from '@/lib/supabase';

export async function requestPhoneOtp(phone: string) {
  if (!supabase) throw new Error('Supabase is not configured. Add your project URL and publishable key, or continue browsing as a guest.');
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
}

export async function verifyPhoneOtp(phone: string, token: string) {
  if (!supabase) throw new Error('Supabase is not configured. Add your project URL and publishable key, or continue browsing as a guest.');
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
