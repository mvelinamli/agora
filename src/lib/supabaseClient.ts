import { createClient } from '@supabase/supabase-js';

// Supabase Proje Ayarları (Panelden aldığın bilgileri buraya yapıştır)
const SUPABASE_URL = 'https://rgqwfkzjrytkyilqcgxs.supabase.co'; // Kendi URL'ini yapıştır
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJncXdma3pqcnl0a3lpbHFjZ3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNTU2ODcsImV4cCI6MjA3OTczMTY4N30.3hBbJkRYzAWJDLkxWlaMcaLGnFKuQcalHgmfcK5oSqI'; // Kendi Anon Key'ini yapıştır

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);