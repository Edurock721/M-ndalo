import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseUrl !== 'https://tu-proyecto.supabase.co' &&
    Boolean(supabaseAnonKey) &&
    supabaseAnonKey !== 'placeholder-anon-key' &&
    supabaseAnonKey !== 'tu-anon-public-key'
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
