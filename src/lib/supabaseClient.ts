import { createClient } from '@supabase/supabase-js';

// Supabase Proje Ayarları (Panelden aldığın bilgileri buraya yapıştır)
const SUPABASE_URL = 'https://rgqwfkzjrytkyilqcgxs.supabase.co'; // Kendi URL'ini yapıştır
const SUPABASE_KEY = 'rgqwfkzjrytkyilqcgxs'; // Kendi Anon Key'ini yapıştır

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);