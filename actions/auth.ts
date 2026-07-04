'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return redirect('/login?error=Preencha todos os campos')
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
  try {
    const supabase = await createClient();
    
    // Invalida a sessão no servidor e remove os cookies locais
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Erro ao executar signOut:', error);
  }

  // Redireciona o usuário de volta para o terminal de entrada
  return redirect('/login');
}

