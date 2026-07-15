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

test('bloco 4: checkout e contrato defensivo da API', async () => {
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
  assert.ok(loginResult.data.session, 'Sessão não retornada no login do bloco 4')

  const slug = await resolverSlugTeste(
    supabase,
    loginResult.data.user.id,
    process.env.HML_TEST_SLUG ?? ''
  )

  const checkoutPage = await fetch(`${baseUrl}/${slug}/checkout`, { redirect: 'manual' })
  assert.equal(checkoutPage.status, 200)
  const htmlCheckout = await checkoutPage.text()
  assert.equal(htmlCheckout.includes('Revisar Sacola'), true)
  assert.equal(htmlCheckout.includes('Sua sacola está limpa'), true)
  assert.equal(htmlCheckout.includes('Avançar para Entrega'), true)

  const apiGet = await fetch(`${baseUrl}/api/checkout`, { method: 'GET', redirect: 'manual' })
  assert.equal(apiGet.status, 405)

  const postVazio = await fetch(`${baseUrl}/api/checkout`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  })
  assert.equal(postVazio.status, 400)

  const postSemCliente = await fetch(`${baseUrl}/api/checkout`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      slug,
      itens: [{ item_cardapio_id: 'item-invalido', quantidade: 1 }],
    }),
  })
  assert.equal(postSemCliente.status, 400)

  const postQuantidadeInvalida = await fetch(`${baseUrl}/api/checkout`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      slug,
      itens: [{ item_cardapio_id: 'item-invalido', quantidade: 0 }],
      dadosCliente: { nome: 'Teste', telefone: '11999999999' },
    }),
  })
  assert.equal(postQuantidadeInvalida.status, 400)

  const logoutResult = await supabase.auth.signOut()
  assert.equal(
    logoutResult.error,
    null,
    `Falha no logout de homologação: ${logoutResult.error?.message}`
  )
})
