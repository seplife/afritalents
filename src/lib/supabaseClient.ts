import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jyrlfxrsdloizrfgaunc.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5cmxmeHJzZGxvaXpyZmdhdW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0ODE1ODEsImV4cCI6MjEwMjA1NzU4MX0.ckJKRUbI08k_oaonBZjBPXUQOyfWGekAVafFcQBg-58";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase n\'est pas configuré. Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans un fichier .env à la racine du projet (voir .env.example).'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
