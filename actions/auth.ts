'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password || !email.includes('@')) {
    return redirect('/login?error=Informe e-mail e senha válidos')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect(`/login?error=${encodeURIComponent('Credenciais inválidas')}`)
  }

  // Se o login for bem-sucedido, o middleware fará a verificação
  // Redirecionamos direto para o painel administrativo
  return redirect('/admin/cozinha')
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(`Falha ao encerrar sessão: ${error.message}`);
  }

  // Redireciona o usuário de volta para o terminal de entrada
  return redirect('/login');
}
