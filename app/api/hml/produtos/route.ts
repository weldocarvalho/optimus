import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import type { InsumoFichaInput, AdicionalCustomizadoInput } from '@/actions/admin'
import {
  criarProdutoComComplementos,
  alternarDisponibilidadeProduto,
  excluirProdutosEmLote,
} from '@/actions/admin'

function validarApiHmlHabilitada() {
  return process.env.HML_ENABLE_DB_ITERATION_API === 'true'
}

async function obterRestauranteIdLogado() {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    throw new Error('Usuário não autenticado.')
  }

  const { data: perfil, error: perfilError } = await supabase
    .from('perfis_admin')
    .select('restaurante_id')
    .eq('id', authData.user.id)
    .single()

  if (perfilError || !perfil?.restaurante_id) {
    throw new Error('Perfil administrativo sem restaurante vinculado.')
  }

  return perfil.restaurante_id
}

export async function GET(request: Request) {
  if (!validarApiHmlHabilitada()) {
    return NextResponse.json({ error: 'Rota indisponível.' }, { status: 404 })
  }

  try {
    const supabase = await createClient()
    const restauranteId = await obterRestauranteIdLogado()
    const url = new URL(request.url)
    const prefixo = (url.searchParams.get('prefixo') ?? '').trim()

    const { data, error } = await supabase
      .from('itens_cardapio')
      .select(`
        id,
        nome,
        descricao,
        preco_venda,
        disponivel,
        composicao_produto (
          insumo_id,
          quantidade_necessaria
        ),
        complementos_produto (
          id,
          nome,
          preco_adicional,
          disponivel
        )
      `)
      .eq('restaurante_id', restauranteId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const produtos = prefixo
      ? (data ?? []).filter((produto) => String(produto.nome ?? '').startsWith(prefixo))
      : (data ?? [])

    return NextResponse.json({ produtos })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Falha ao listar produtos.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(request: Request) {
  if (!validarApiHmlHabilitada()) {
    return NextResponse.json({ error: 'Rota indisponível.' }, { status: 404 })
  }

  const body = await request.json()
  const nome = String(body?.nome ?? '').trim()
  const descricao = String(body?.descricao ?? '').trim()
  const precoVenda = Number(body?.precoVenda)
  const fichaTecnica = Array.isArray(body?.fichaTecnica) ? body.fichaTecnica : []
  const complementos = Array.isArray(body?.complementos) ? body.complementos : []

  if (fichaTecnica.length === 0) {
    return NextResponse.json({ error: 'Ficha técnica obrigatória.' }, { status: 400 })
  }
  if (complementos.length === 0) {
    return NextResponse.json({ error: 'Complementos são obrigatórios nesta etapa.' }, { status: 400 })
  }

  const resultado = await criarProdutoComComplementos(
    nome,
    descricao,
    precoVenda,
    fichaTecnica as InsumoFichaInput[],
    complementos as AdicionalCustomizadoInput[]
  )

  if (!resultado.success) {
    return NextResponse.json({ error: String(resultado.error ?? 'Falha ao criar produto.') }, { status: 400 })
  }

  return NextResponse.json({ success: true, itemId: resultado.itemId })
}

export async function PATCH(request: Request) {
  if (!validarApiHmlHabilitada()) {
    return NextResponse.json({ error: 'Rota indisponível.' }, { status: 404 })
  }

  const body = await request.json()
  const id = String(body?.id ?? '').trim()
  const statusAtual = Boolean(body?.statusAtual)

  await alternarDisponibilidadeProduto(id, statusAtual)
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  if (!validarApiHmlHabilitada()) {
    return NextResponse.json({ error: 'Rota indisponível.' }, { status: 404 })
  }

  const body = await request.json()
  const idsBrutos: unknown[] = Array.isArray(body?.ids) ? body.ids : []
  const ids = idsBrutos.filter((id): id is string => typeof id === 'string' && id.length > 0)

  const resultado = await excluirProdutosEmLote(ids)
  if (!resultado.success) {
    return NextResponse.json({ error: String(resultado.error ?? 'Falha ao excluir produtos.') }, { status: 400 })
  }

  return NextResponse.json({ success: true, removidos: ids.length })
}
