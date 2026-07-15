import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServerClient } from '@supabase/ssr'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const rootDir = path.resolve(__dirname, '..', '..')
export const serverPort = Number(process.env.HML_APP_PORT ?? 4100)
export const baseUrl = process.env.HML_BASE_URL ?? `http://127.0.0.1:${serverPort}`
export const loginEmail = process.env.HML_TEST_EMAIL ?? 'teste@restaurante.com'
export const loginPassword = process.env.HML_TEST_PASSWORD ?? '1234'

export function carregarEnvLocal() {
  const envPath = path.join(rootDir, '.env.local')
  if (!fs.existsSync(envPath)) return

  const content = fs.readFileSync(envPath, 'utf-8')
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const equalsIndex = line.indexOf('=')
    if (equalsIndex <= 0) continue

    const key = line.slice(0, equalsIndex).trim()
    if (!key || process.env[key] !== undefined) continue

    let value = line.slice(equalsIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

export async function esperarServidorPronto(url, timeoutMs = 30_000) {
  const startedAt = Date.now()
  let lastError

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${url}/login`, { redirect: 'manual' })
      if (response.status >= 200 && response.status < 500) return
    } catch (error) {
      lastError = error
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(`Servidor não respondeu em ${timeoutMs}ms (${String(lastError)})`)
}

export function iniciarServidor() {
  return spawn('npm', ['run', 'start', '--', '-p', String(serverPort)], {
    cwd: rootDir,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

export async function pararServidor(servidor) {
  if (!servidor?.pid) return
  servidor.kill('SIGTERM')
  await new Promise((resolve) => setTimeout(resolve, 500))
}

export function montarCookieHeader(cookies) {
  return cookies
    .filter((cookie) => typeof cookie.value === 'string' && cookie.value.length > 0)
    .map((cookie) => `${cookie.name}=${encodeURIComponent(cookie.value)}`)
    .join('; ')
}

export function criarJarCookies() {
  const cookies = []
  return {
    cookies,
    upsert(cookiesToSet) {
      for (const cookie of cookiesToSet) {
        const idx = cookies.findIndex((item) => item.name === cookie.name)
        if (idx >= 0) cookies[idx] = { ...cookies[idx], ...cookie }
        else cookies.push({ ...cookie })
      }
    },
  }
}

export function criarSupabaseAuthClient(jar, supabaseUrl, supabasePublishableKey) {
  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => jar.cookies,
      setAll: (cookiesToSet) => jar.upsert(cookiesToSet),
    },
  })
}

export async function resolverSlugTeste(supabase, userId, slugDefinido = '') {
  if (slugDefinido) return slugDefinido

  const { data: perfil, error: perfilError } = await supabase
    .from('perfis_admin')
    .select('restaurante_id')
    .eq('id', userId)
    .single()

  if (perfilError || !perfil?.restaurante_id) {
    throw new Error(`Falha ao buscar perfil administrativo: ${perfilError?.message ?? 'sem restaurante_id'}`)
  }

  const { data: restaurante, error: restError } = await supabase
    .from('restaurantes')
    .select('slug')
    .eq('id', perfil.restaurante_id)
    .single()

  if (restError || !restaurante?.slug) {
    throw new Error(`Falha ao buscar slug do restaurante: ${restError?.message ?? 'slug ausente'}`)
  }

  return restaurante.slug
}
