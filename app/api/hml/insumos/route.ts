import { NextResponse } from 'next/server'
import {
  listarInsumosAdmin,
  criarInsumoAdmin,
  atualizarCustoInsumoAdmin,
  excluirInsumosEmLote,
} from '@/actions/adminInsumos'

function validarApiHmlHabilitada() {
  return process.env.HML_ENABLE_DB_ITERATION_API === 'true'
}

export async function GET(request: Request) {
  if (!validarApiHmlHabilitada()) {
    return NextResponse.json({ error: 'Rota indisponível.' }, { status: 404 })
  }

  const url = new URL(request.url)
  const prefixo = (url.searchParams.get('prefixo') ?? '').trim()

  const insumos = await listarInsumosAdmin()
  const filtrados = prefixo
    ? insumos.filter((insumo) => insumo.nome.startsWith(prefixo))
    : insumos

  return NextResponse.json({ insumos: filtrados })
}

export async function POST(request: Request) {
  if (!validarApiHmlHabilitada()) {
    return NextResponse.json({ error: 'Rota indisponível.' }, { status: 404 })
  }

  const body = await request.json()
  const nome = String(body?.nome ?? '').trim()
  const unidade = body?.unidade as 'g' | 'ml' | 'un'
  const custo = Number(body?.custo)
  const estoqueAtual = Number(body?.estoqueAtual)
  const estoqueMinimo = Number(body?.estoqueMinimo)

  const resultado = await criarInsumoAdmin(nome, unidade, custo, estoqueAtual, estoqueMinimo)
  if (!resultado.success) {
    return NextResponse.json({ error: String(resultado.error ?? 'Falha ao criar insumo.') }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request) {
  if (!validarApiHmlHabilitada()) {
    return NextResponse.json({ error: 'Rota indisponível.' }, { status: 404 })
  }

  const body = await request.json()
  const id = String(body?.id ?? '')
  const custo = Number(body?.custo)
  const estoqueAtual = Number(body?.estoqueAtual)
  const estoqueMinimo = Number(body?.estoqueMinimo)

  const resultado = await atualizarCustoInsumoAdmin(id, custo, estoqueAtual, estoqueMinimo)
  if (!resultado.success) {
    return NextResponse.json({ error: String(resultado.error ?? 'Falha ao atualizar insumo.') }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  if (!validarApiHmlHabilitada()) {
    return NextResponse.json({ error: 'Rota indisponível.' }, { status: 404 })
  }

  const body = await request.json()
  const idsBrutos: unknown[] = Array.isArray(body?.ids) ? body.ids : []
  const ids = idsBrutos.filter((id): id is string => typeof id === 'string' && id.length > 0)

  const resultado = await excluirInsumosEmLote(ids)
  if (!resultado.success) {
    return NextResponse.json({ error: String(resultado.error ?? 'Falha ao excluir insumos.') }, { status: 400 })
  }

  return NextResponse.json({ success: true, removidos: ids.length })
}
