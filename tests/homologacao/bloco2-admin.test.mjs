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

test('bloco 2: rotas administrativas protegidas e acessíveis com sessão', async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  assert.ok(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL não configurada')
  assert.ok(
    supabasePublishableKey,
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY não configurada'
  )

  const rotasAdmin = ['/admin/produtos', '/admin/insumos', '/admin/metricas']

  for (const rota of rotasAdmin) {
    const semSessao = await fetch(`${baseUrl}${rota}`, { redirect: 'manual' })
    assert.equal(semSessao.status, 307, `Sem sessão deveria redirecionar em ${rota}`)
    assert.equal(
      semSessao.headers.get('location'),
      '/login',
      `Sem sessão deveria ir para /login em ${rota}`
    )
  }

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
  assert.ok(loginResult.data.session, 'Sessão não retornada no login do bloco 2')

  const marcadoresEsperados = {
    '/admin/produtos': 'Encerrar Sessão',
    '/admin/insumos': 'Insumos',
    '/admin/metricas': 'Métricas',
  }

  for (const rota of rotasAdmin) {
    const comSessao = await fetch(`${baseUrl}${rota}`, {
      redirect: 'manual',
      headers: { cookie: montarCookieHeader(jar.cookies) },
    })
    assert.equal(comSessao.status, 200, `Com sessão deveria abrir ${rota}`)
    const html = await comSessao.text()
    assert.equal(
      html.includes(marcadoresEsperados[rota]),
      true,
      `Página ${rota} deveria conter marcador ${marcadoresEsperados[rota]}`
    )
  }

  const logoutResult = await supabase.auth.signOut()
  assert.equal(
    logoutResult.error,
    null,
    `Falha no logout de homologação: ${logoutResult.error?.message}`
  )
})
