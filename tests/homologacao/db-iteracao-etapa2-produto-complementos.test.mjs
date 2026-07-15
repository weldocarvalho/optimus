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
  process.env.HML_ENABLE_DB_ITERATION_API = 'true'
  servidor = iniciarServidor()
  await esperarServidorPronto(baseUrl)
})

after(async () => {
  await pararServidor(servidor)
})

test('iteração DB etapa 2: produto com ficha técnica e complementos obrigatórios', async () => {
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
  assert.equal(loginResult.error, null, `Falha no login: ${loginResult.error?.message}`)
  assert.ok(loginResult.data.session, 'Sessão não retornada no login')

  const cookie = montarCookieHeader(jar.cookies)
  const prefixo = `HML_DB_PROD_${Date.now()}`
  const nomeInsumo = `${prefixo}_INSUMO`
  const nomeProduto = `${prefixo}_PRODUTO`

  let insumoId = null
  let produtoId = null

  const criarInsumoResp = await fetch(`${baseUrl}/api/hml/insumos`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({
      nome: nomeInsumo,
      unidade: 'un',
      custo: 4.75,
      estoqueAtual: 30,
      estoqueMinimo: 5,
    }),
  })
  assert.equal(criarInsumoResp.status, 200)

  try {
    const listarInsumoResp = await fetch(
      `${baseUrl}/api/hml/insumos?prefixo=${encodeURIComponent(prefixo)}`,
      { headers: { cookie } }
    )
    assert.equal(listarInsumoResp.status, 200)
    const listarInsumoBody = await listarInsumoResp.json()
    const insumo = (listarInsumoBody.insumos ?? []).find((item) => item.nome === nomeInsumo)
    assert.ok(insumo, 'Insumo de apoio não encontrado')
    insumoId = insumo.id

    const criarProdutoResp = await fetch(`${baseUrl}/api/hml/produtos`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({
        nome: nomeProduto,
        descricao: 'Produto de teste da etapa 2',
        precoVenda: 29.9,
        fichaTecnica: [{ insumo_id: insumoId, quantidade_necessaria: 2 }],
        complementos: [{ nome: `${prefixo}_ADICIONAL`, preco: 3.5 }],
      }),
    })
    assert.equal(criarProdutoResp.status, 200)
    const criarProdutoBody = await criarProdutoResp.json()
    produtoId = String(criarProdutoBody.itemId ?? '')
    assert.ok(produtoId, 'itemId do produto não retornado')

    const listarProdutoResp = await fetch(
      `${baseUrl}/api/hml/produtos?prefixo=${encodeURIComponent(prefixo)}`,
      { headers: { cookie } }
    )
    assert.equal(listarProdutoResp.status, 200)
    const listarProdutoBody = await listarProdutoResp.json()
    const produto = (listarProdutoBody.produtos ?? []).find((item) => item.id === produtoId)
    assert.ok(produto, 'Produto criado não encontrado')
    assert.equal(Array.isArray(produto.complementos_produto), true)
    assert.equal(produto.complementos_produto.length > 0, true, 'Complementos não persistidos')
    assert.equal(Array.isArray(produto.composicao_produto), true)
    assert.equal(produto.composicao_produto.length > 0, true, 'Ficha técnica não persistida')
    assert.equal(
      produto.composicao_produto.some((composicao) => composicao.insumo_id === insumoId),
      true,
      'Insumo da ficha técnica não vinculado ao produto'
    )

    const disponibilidadeAntes = Boolean(produto.disponivel)
    const toggleResp = await fetch(`${baseUrl}/api/hml/produtos`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ id: produtoId, statusAtual: disponibilidadeAntes }),
    })
    assert.equal(toggleResp.status, 200)

    const listarPosToggleResp = await fetch(
      `${baseUrl}/api/hml/produtos?prefixo=${encodeURIComponent(prefixo)}`,
      { headers: { cookie } }
    )
    assert.equal(listarPosToggleResp.status, 200)
    const listarPosToggleBody = await listarPosToggleResp.json()
    const produtoPosToggle = (listarPosToggleBody.produtos ?? []).find((item) => item.id === produtoId)
    assert.ok(produtoPosToggle, 'Produto não encontrado após alternar disponibilidade')
    assert.equal(Boolean(produtoPosToggle.disponivel), !disponibilidadeAntes)
  } finally {
    if (produtoId) {
      await fetch(`${baseUrl}/api/hml/produtos`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({ ids: [produtoId] }),
      })
    }

    if (insumoId) {
      await fetch(`${baseUrl}/api/hml/insumos`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({ ids: [insumoId] }),
      })
    }
  }

  const listarProdutosFinalResp = await fetch(
    `${baseUrl}/api/hml/produtos?prefixo=${encodeURIComponent(prefixo)}`,
    { headers: { cookie } }
  )
  assert.equal(listarProdutosFinalResp.status, 200)
  const listarProdutosFinalBody = await listarProdutosFinalResp.json()
  assert.equal((listarProdutosFinalBody.produtos ?? []).length, 0, 'Cleanup de produtos falhou')

  const listarInsumosFinalResp = await fetch(
    `${baseUrl}/api/hml/insumos?prefixo=${encodeURIComponent(prefixo)}`,
    { headers: { cookie } }
  )
  assert.equal(listarInsumosFinalResp.status, 200)
  const listarInsumosFinalBody = await listarInsumosFinalResp.json()
  assert.equal((listarInsumosFinalBody.insumos ?? []).length, 0, 'Cleanup de insumos falhou')

  const logoutResult = await supabase.auth.signOut()
  assert.equal(logoutResult.error, null, `Falha no logout: ${logoutResult.error?.message}`)
})
