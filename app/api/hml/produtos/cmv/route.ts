import { NextResponse } from 'next/server'
import { listarProdutosComCMV } from '@/actions/admin'

function validarApiHmlHabilitada() {
  return process.env.HML_ENABLE_DB_ITERATION_API === 'true'
}

export async function GET(request: Request) {
  if (!validarApiHmlHabilitada()) {
    return NextResponse.json({ error: 'Rota indisponível.' }, { status: 404 })
  }

  const url = new URL(request.url)
  const prefixo = (url.searchParams.get('prefixo') ?? '').trim()

  const produtos = await listarProdutosComCMV()
  const filtrados = prefixo
    ? produtos.filter((produto) => produto.nome.startsWith(prefixo))
    : produtos

  return NextResponse.json({ produtos: filtrados })
}
