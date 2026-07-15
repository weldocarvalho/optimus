// actions/cardapio.ts
'use server'

import { createClient } from '@/utils/supabase/server'

/**
 * Busca os itens do cardápio de um restaurante específico pelo seu Slug,
 * incluindo a relação de complementos cadastrados (tabela complementos_produto).
 * 
 * @param slug O slug identificador do restaurante na URL (ex: 'burger-house')
 */
export async function obterCardapioPorSlug(slug: string) {
  const supabase = await createClient()

  // 1. Busca primeiro o ID e nome do restaurante usando o slug da URL
  const { data: restaurante, error: erroRestaurante } = await supabase
    .from('restaurantes')
    .select('id, nome, tipo')
    .eq('slug', slug)
    .single()

  if (erroRestaurante || !restaurante) {
    console.error('Erro ao localizar restaurante pelo slug:', erroRestaurante)
    return { restaurante: null, produtos: [] }
  }

  // 2. Busca os itens de cardápio do restaurante com JOIN reativo na tabela complementos_produto
  const { data: produtos, error: erroProdutos } = await supabase
    .from('itens_cardapio')
    .select(`
      id,
      nome,
      descricao,
      preco_venda,
      imagem_url,
      disponivel,
      complementos_produto (
        id,
        nome,
        preco_adicional,
        disponivel
      )
    `)
    .eq('restaurante_id', restaurante.id)
    .eq('disponivel', true) // Garante que só exibe itens ativos na vitrine pública
    .order('created_at', { ascending: true })

  if (erroProdutos) {
    console.error('Erro ao buscar itens e complementos do cardápio:', erroProdutos)
    return { restaurante, produtos: [] }
  }

  return {
    restaurante,
    produtos: produtos || []
  }
}
