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

test('iteração DB etapa 1: criar, editar e excluir insumo via action com persistência', async () => {
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
  const prefixo = `HML_DB_INSUMO_${Date.now()}`
  const nomeInsumo = `${prefixo}_A`
  let idCriado = null

  const criarResp = await fetch(`${baseUrl}/api/hml/insumos`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({
      nome: nomeInsumo,
      unidade: 'un',
      custo: 5.25,
      estoqueAtual: 20,
      estoqueMinimo: 4,
    }),
  })
  assert.equal(criarResp.status, 200)

  try {
    const listarCriadoResp = await fetch(
      `${baseUrl}/api/hml/insumos?prefixo=${encodeURIComponent(prefixo)}`,
      { headers: { cookie } }
    )
    assert.equal(listarCriadoResp.status, 200)
    const listarCriadoBody = await listarCriadoResp.json()
    const listaCriada = Array.isArray(listarCriadoBody.insumos) ? listarCriadoBody.insumos : []
    assert.equal(listaCriada.length >= 1, true, 'Insumo criado não encontrado na listagem')
    const insumoCriado = listaCriada.find((insumo) => insumo.nome === nomeInsumo)
    assert.ok(insumoCriado, 'Insumo criado não encontrado pelo nome')
    idCriado = insumoCriado.id

    const atualizarResp = await fetch(`${baseUrl}/api/hml/insumos`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({
        id: idCriado,
        custo: 7.9,
        estoqueAtual: 15,
        estoqueMinimo: 3,
      }),
    })
    assert.equal(atualizarResp.status, 200)

    const listarAtualizadoResp = await fetch(
      `${baseUrl}/api/hml/insumos?prefixo=${encodeURIComponent(prefixo)}`,
      { headers: { cookie } }
    )
    assert.equal(listarAtualizadoResp.status, 200)
    const listarAtualizadoBody = await listarAtualizadoResp.json()
    const listaAtualizada = Array.isArray(listarAtualizadoBody.insumos)
      ? listarAtualizadoBody.insumos
      : []
    const insumoAtualizado = listaAtualizada.find((insumo) => insumo.id === idCriado)
    assert.ok(insumoAtualizado, 'Insumo atualizado não encontrado')
    assert.equal(Number(insumoAtualizado.custo_unitario), 7.9)
    assert.equal(Number(insumoAtualizado.estoque_atual), 15)
    assert.equal(Number(insumoAtualizado.estoque_minimo), 3)
  } finally {
    if (idCriado) {
      await fetch(`${baseUrl}/api/hml/insumos`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({ ids: [idCriado] }),
      })
    }
  }

  const listarFinalResp = await fetch(
    `${baseUrl}/api/hml/insumos?prefixo=${encodeURIComponent(prefixo)}`,
    { headers: { cookie } }
  )
  assert.equal(listarFinalResp.status, 200)
  const listarFinalBody = await listarFinalResp.json()
  const listaFinal = Array.isArray(listarFinalBody.insumos) ? listarFinalBody.insumos : []
  assert.equal(listaFinal.length, 0, 'Cleanup da etapa 1 não removeu todos os insumos de teste')

  const logoutResult = await supabase.auth.signOut()
  assert.equal(logoutResult.error, null, `Falha no logout: ${logoutResult.error?.message}`)
})
