export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { user_id: string; full_name: string | null; phone: string | null; avatar_url: string | null; created_at: string; updated_at: string };
        Insert: { user_id: string; full_name?: string | null; phone?: string | null; avatar_url?: string | null; created_at?: string; updated_at?: string };
        Update: { full_name?: string | null; avatar_url?: string | null; updated_at?: string };
        Relationships: [];
      };
      pandit_profiles: {
        Row: { user_id: string; display_name: string; bio: string | null; experience_years: number; languages: string[]; city: string; service_areas: string[]; verification_status: 'pending' | 'verified' | 'rejected'; created_at: string; updated_at: string };
        Insert: { user_id: string; display_name: string; bio?: string | null; experience_years?: number; languages?: string[]; city: string; service_areas?: string[]; created_at?: string; updated_at?: string };
        Update: { display_name?: string; bio?: string | null; experience_years?: number; languages?: string[]; city?: string; service_areas?: string[]; updated_at?: string };
        Relationships: [];
      };
      puja_categories: {
        Row: { id: string; name: string; description: string | null; image_url: string | null; active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; description?: string | null; image_url?: string | null; active?: boolean; created_at?: string; updated_at?: string };
        Update: { name?: string; description?: string | null; image_url?: string | null; active?: boolean; updated_at?: string };
        Relationships: [];
      };
      puja_services: {
        Row: { id: string; category_id: string; name: string; description: string; purpose: string | null; duration_minutes: number; base_price: number; samagri_price: number; languages: string[]; included: string[]; excluded: string[]; cancellation_policy: string | null; active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; category_id: string; name: string; description: string; purpose?: string | null; duration_minutes: number; base_price: number; samagri_price?: number; languages?: string[]; included?: string[]; excluded?: string[]; cancellation_policy?: string | null; active?: boolean; created_at?: string; updated_at?: string };
        Update: { category_id?: string; name?: string; description?: string; purpose?: string | null; duration_minutes?: number; base_price?: number; samagri_price?: number; languages?: string[]; included?: string[]; excluded?: string[]; cancellation_policy?: string | null; active?: boolean; updated_at?: string };
        Relationships: [{ foreignKeyName: 'puja_services_category_id_fkey'; columns: ['category_id']; isOneToOne: false; referencedRelation: 'puja_categories'; referencedColumns: ['id'] }];
      };
      pandit_services: {
        Row: { id: string; pandit_user_id: string; service_id: string; created_at: string };
        Insert: { id?: string; pandit_user_id: string; service_id: string; created_at?: string };
        Update: { pandit_user_id?: string; service_id?: string };
        Relationships: [{ foreignKeyName: 'pandit_services_pandit_user_id_fkey'; columns: ['pandit_user_id']; isOneToOne: false; referencedRelation: 'pandit_profiles'; referencedColumns: ['user_id'] }, { foreignKeyName: 'pandit_services_service_id_fkey'; columns: ['service_id']; isOneToOne: false; referencedRelation: 'puja_services'; referencedColumns: ['id'] }];
      };
      bookings: {
        Row: { id: string; customer_id: string; pandit_user_id: string | null; service_id: string; scheduled_at: string; duration_minutes: number; address: string; city: string; postal_code: string; preferred_language: string; notes: string | null; samagri_included: boolean; service_price: number; samagri_price: number; total_price: number; status: 'requested' | 'accepted' | 'declined' | 'cancelled' | 'completed'; created_at: string; updated_at: string };
        Insert: never;
        Update: never;
        Relationships: [{ foreignKeyName: 'bookings_customer_id_fkey'; columns: ['customer_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['user_id'] }, { foreignKeyName: 'bookings_pandit_user_id_fkey'; columns: ['pandit_user_id']; isOneToOne: false; referencedRelation: 'pandit_profiles'; referencedColumns: ['user_id'] }, { foreignKeyName: 'bookings_service_id_fkey'; columns: ['service_id']; isOneToOne: false; referencedRelation: 'puja_services'; referencedColumns: ['id'] }];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_booking: { Args: { p_service_id: string; p_scheduled_at: string; p_address: string; p_city: string; p_postal_code: string; p_notes?: string | null; p_samagri_included?: boolean; p_pandit_user_id?: string | null; p_preferred_language?: string | null }; Returns: Database['public']['Tables']['bookings']['Row'] };
      accept_booking: { Args: { p_booking_id: string }; Returns: Database['public']['Tables']['bookings']['Row'] };
      decline_booking: { Args: { p_booking_id: string }; Returns: Database['public']['Tables']['bookings']['Row'] };
      cancel_booking: { Args: { p_booking_id: string }; Returns: Database['public']['Tables']['bookings']['Row'] };
      complete_booking: { Args: { p_booking_id: string }; Returns: Database['public']['Tables']['bookings']['Row'] };
      assign_booking: { Args: { p_booking_id: string; p_pandit_user_id: string }; Returns: Database['public']['Tables']['bookings']['Row'] };
      set_pandit_verification: { Args: { p_pandit_user_id: string; p_status: 'pending' | 'verified' | 'rejected' }; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
