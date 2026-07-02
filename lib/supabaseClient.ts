// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, ''); // Remove barra no final se existir
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('As variáveis de ambiente públicas do Supabase estão faltando no .env.local');
}

console.log('Supabase Client initialized with URL:', supabaseUrl);

export const supabaseClient = createClient(supabaseUrl, supabasePublishableKey);
