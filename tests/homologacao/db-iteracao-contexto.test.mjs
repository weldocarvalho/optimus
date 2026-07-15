import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  loginEmail,
  loginPassword,
  carregarEnvLocal,
  criarJarCookies,
  criarSupabaseAuthClient,
} from './helpers.mjs'

carregarEnvLocal()

test('iteração DB etapa inicial: gestor autenticado com restaurante vinculado', async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  assert.ok(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL não configurada')
  assert.ok(
    supabasePublishableKey,
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY não configurada'
  )

  const jar = criarJarCookies()
  const supabase = criarSupabaseAuthClient(jar, supabaseUrl, supabasePublishableKey)

  const loginResult = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password: loginPassword,
  })
  assert.equal(
    loginResult.error,
    null,
    `Falha no login de homologação: ${loginResult.error?.message}`
  )
  assert.ok(loginResult.data.session, 'Sessão não retornada no login')

  const { data: perfil, error: perfilError } = await supabase
    .from('perfis_admin')
    .select('restaurante_id')
    .eq('id', loginResult.data.user.id)
    .single()

  assert.equal(
    perfilError,
    null,
    `Falha ao buscar perfil administrativo: ${perfilError?.message}`
  )
  assert.ok(perfil?.restaurante_id, 'restaurante_id não encontrado em perfis_admin')

  const { data: restaurante, error: restauranteError } = await supabase
    .from('restaurantes')
    .select('id,slug,nome')
    .eq('id', perfil.restaurante_id)
    .single()

  assert.equal(
    restauranteError,
    null,
    `Falha ao buscar restaurante vinculado: ${restauranteError?.message}`
  )
  assert.equal(restaurante?.id, perfil.restaurante_id)
  assert.equal(typeof restaurante?.slug, 'string')
  assert.equal(Boolean(restaurante?.slug), true)
  assert.equal(typeof restaurante?.nome, 'string')
  assert.equal(Boolean(restaurante?.nome), true)

  const logoutResult = await supabase.auth.signOut()
  assert.equal(
    logoutResult.error,
    null,
    `Falha no logout de homologação: ${logoutResult.error?.message}`
  )
})
