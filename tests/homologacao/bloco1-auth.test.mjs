import assert from 'node:assert/strict'
import { test, before, after } from 'node:test'
import {
  baseUrl,
  loginEmail,
  loginPassword,
  carregarEnvLocal,
  esperarServidorPronto,
  iniciarServidor,
  pararServidor,
  montarCookieHeader,
  criarJarCookies,
  criarSupabaseAuthClient,
} from './helpers.mjs'

let servidor

before(async () => {
  carregarEnvLocal()
  servidor = iniciarServidor()
  await esperarServidorPronto(baseUrl)
})

after(async () => {
  await pararServidor(servidor)
})

test('bloco 1: autenticação, sessão e logout', async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  assert.ok(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL não configurada')
  assert.ok(
    supabasePublishableKey,
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY não configurada'
  )

  const semSessao = await fetch(`${baseUrl}/admin/produtos`, { redirect: 'manual' })
  assert.equal(semSessao.status, 307)
  assert.equal(semSessao.headers.get('location'), '/login')

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

  const adminComSessao = await fetch(`${baseUrl}/admin/produtos`, {
    redirect: 'manual',
    headers: { cookie: montarCookieHeader(jar.cookies) },
  })
  assert.equal(adminComSessao.status, 200)

  const logoutResult = await supabase.auth.signOut()
  assert.equal(
    logoutResult.error,
    null,
    `Falha no logout de homologação: ${logoutResult.error?.message}`
  )

  const adminPosLogout = await fetch(`${baseUrl}/admin/produtos`, {
    redirect: 'manual',
    headers: { cookie: montarCookieHeader(jar.cookies) },
  })
  assert.equal(adminPosLogout.status, 307)
  assert.equal(adminPosLogout.headers.get('location'), '/login')
})
