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

test('iteração DB etapa 3: leituras gerenciais com consistência de CMV', async () => {
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
  const prefixo = `HML_DB_CMV_${Date.now()}`
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
      custo: 10,
      estoqueAtual: 50,
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
        descricao: 'Produto para validação de CMV',
        precoVenda: 40,
        fichaTecnica: [{ insumo_id: insumoId, quantidade_necessaria: 2 }],
        complementos: [{ nome: `${prefixo}_ADICIONAL`, preco: 5 }],
      }),
    })
    assert.equal(criarProdutoResp.status, 200)
    const criarProdutoBody = await criarProdutoResp.json()
    produtoId = String(criarProdutoBody.itemId ?? '')
    assert.ok(produtoId, 'Produto de teste não criado')

    const listarCmvResp = await fetch(
      `${baseUrl}/api/hml/produtos/cmv?prefixo=${encodeURIComponent(prefixo)}`,
      { headers: { cookie } }
    )
    assert.equal(listarCmvResp.status, 200)
    const listarCmvBody = await listarCmvResp.json()
    const produtoCmv = (listarCmvBody.produtos ?? []).find((item) => item.id === produtoId)
    assert.ok(produtoCmv, 'Produto não encontrado na leitura de CMV')
    assert.equal(produtoCmv.nome, nomeProduto)
    assert.equal(Number(produtoCmv.custo_producao), 20)
    assert.equal(Number(produtoCmv.percentual_cmv), 50)
    assert.equal(Number(produtoCmv.margem_lucro), 20)
    assert.equal(Array.isArray(produtoCmv.ingredientes), true)
    assert.equal(produtoCmv.ingredientes.length > 0, true)

    const listarInsumosGerencialResp = await fetch(
      `${baseUrl}/api/hml/insumos?prefixo=${encodeURIComponent(prefixo)}`,
      { headers: { cookie } }
    )
    assert.equal(listarInsumosGerencialResp.status, 200)
    const listarInsumosGerencialBody = await listarInsumosGerencialResp.json()
    const insumosFiltrados = listarInsumosGerencialBody.insumos ?? []
    assert.equal(insumosFiltrados.length >= 1, true)
    assert.equal(
      insumosFiltrados.every((item) => String(item.nome).startsWith(prefixo)),
      true,
      'Leitura de insumos retornou item fora do prefixo esperado'
    )
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

  const listarCmvFinalResp = await fetch(
    `${baseUrl}/api/hml/produtos/cmv?prefixo=${encodeURIComponent(prefixo)}`,
    { headers: { cookie } }
  )
  assert.equal(listarCmvFinalResp.status, 200)
  const listarCmvFinalBody = await listarCmvFinalResp.json()
  assert.equal((listarCmvFinalBody.produtos ?? []).length, 0, 'Cleanup de produto não concluído')

  const listarInsumoFinalResp = await fetch(
    `${baseUrl}/api/hml/insumos?prefixo=${encodeURIComponent(prefixo)}`,
    { headers: { cookie } }
  )
  assert.equal(listarInsumoFinalResp.status, 200)
  const listarInsumoFinalBody = await listarInsumoFinalResp.json()
  assert.equal((listarInsumoFinalBody.insumos ?? []).length, 0, 'Cleanup de insumo não concluído')

  const logoutResult = await supabase.auth.signOut()
  assert.equal(logoutResult.error, null, `Falha no logout: ${logoutResult.error?.message}`)
})
