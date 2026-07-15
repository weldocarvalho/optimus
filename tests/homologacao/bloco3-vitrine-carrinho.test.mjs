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
  criarJarCookies,
  criarSupabaseAuthClient,
  resolverSlugTeste,
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

test('bloco 3: vitrine por slug e checkout com carrinho vazio', async () => {
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
  assert.ok(loginResult.data.session, 'Sessão não retornada no login do bloco 3')

  const slug = await resolverSlugTeste(
    supabase,
    loginResult.data.user.id,
    process.env.HML_TEST_SLUG ?? ''
  )

  const vitrine = await fetch(`${baseUrl}/${slug}`, { redirect: 'manual' })
  assert.equal(vitrine.status, 200)
  const htmlVitrine = await vitrine.text()
  assert.equal(htmlVitrine.includes('Cardápio'), true)
  assert.equal(htmlVitrine.includes('Os Mais Vendidos'), true)

  const checkout = await fetch(`${baseUrl}/${slug}/checkout`, { redirect: 'manual' })
  assert.equal(checkout.status, 200)
  const htmlCheckout = await checkout.text()
  assert.equal(htmlCheckout.includes('Sua sacola está limpa'), true)
  assert.equal(htmlCheckout.includes('Avançar para Entrega'), true)

  const logoutResult = await supabase.auth.signOut()
  assert.equal(
    logoutResult.error,
    null,
    `Falha no logout de homologação: ${logoutResult.error?.message}`
  )
})
