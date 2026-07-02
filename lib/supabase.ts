// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, ''); // Remove barra no final se existir
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error('As variáveis de ambiente do Supabase estão faltando no .env.local');
}

// imprima as variaveis
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Secret Key:', supabaseSecretKey);

export const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false, // Boa prática para rotas de servidor (Node/Next)
  }
});
