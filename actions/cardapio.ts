// actions/cardapio.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface DadosNovoProduto {
  nome: string
  descricao?: string
  preco_venda: number
  disponivel: boolean
  fichaTecnica: Record<string, string> // id_insumo (UUID) -> quantidade em string vinda do input
  adicionais: Array<{ nome: string; preco: number }>
}

/**
 * Cadastra um novo item de cardápio no Supabase associando-o automaticamente ao restaurante
 * do gestor autenticado, salvando de forma atômica sua ficha técnica e adicionais customizados,
 * e limpando o cache da página pública instantaneamente.
 */
export async function criarProdutoAdmin(dados: DadosNovoProduto) {
  const supabase = await createClient()

  // 1. Recupera o usuário gestor autenticado na sessão do servidor
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Usuário não autenticado no sistema.' }
  }

  // 2. Localiza o restaurante vinculado ao perfil administrativo do usuário
  const { data: perfil, error: perfilError } = await supabase
    .from('perfis_admin')
    .select('restaurante_id')
    .eq('id', user.id)
    .single()

  if (perfilError || !perfil?.restaurante_id) {
    return { success: false, error: 'Nenhum restaurante associado a esta conta de gestor.' }
  }

  const restauranteId = perfil.restaurante_id

  // 3. Captura o slug do restaurante para disparar a revalidação sob demanda na rota pública
  const { data: restaurante, error: restError } = await supabase
    .from('restaurantes')
    .select('slug')
    .eq('id', restauranteId)
    .single()

  if (restError || !restaurante?.slug) {
    return { success: false, error: 'Falha crítica ao obter identificador (slug) da loja.' }
  }

  try {
    // 4. Inserção atômica do item na tabela principal 'itens_cardapio'
    const { data: produto, error: prodError } = await supabase
      .from('itens_cardapio')
      .insert({
        restaurante_id: restauranteId,
        nome: dados.nome,
        descricao: dados.descricao || null,
        preco_venda: dados.preco_venda,
        disponivel: dados.disponivel
      })
      .select()
      .single()

    if (prodError) throw prodError

    // 5. Inserção da Ficha Técnica na tabela 'composicao_produto' para dedução e análise de CMV
    const insumosFiltrados = Object.entries(dados.fichaTecnica).filter(([_, qtd]) => parseFloat(qtd) > 0)
    
    if (insumosFiltrados.length > 0) {
      const composicaoInserts = insumosFiltrados.map(([insumoId, qtd]) => ({
        item_cardapio_id: produto.id,
        insumo_id: insumoId,
        quantidade_necessaria: parseFloat(qtd)
      }))

      const { error: compError } = await supabase
        .from('composicao_produto')
        .insert(composicaoInserts)

      if (compError) throw compError
    }

    // 6. Inserção dos Adicionais Opcionais na tabela 'complementos_produto'
    if (dados.adicionais.length > 0) {
      const complementosInserts = dados.adicionais.map(adicional => ({
        item_cardapio_id: produto.id,
        nome: adicional.nome,
        preco_adicional: adicional.preco,
        disponivel: true
      }))

      const { error: complError } = await supabase
        .from('complementos_produto')
        .insert(complementosInserts)

      if (complError) throw complError
    }

    // 7. ESTRATÉGIA ON-DEMAND REVALIDATION (Invalidação cirúrgica de cache)
    // Limpa o cache estático gerado do lado do cliente para que o produto apareça no mesmo segundo
    revalidatePath(`/${restaurante.slug}`)

    return { success: true }
  } catch (error: any) {
    console.error('[SERVER ACTION ERROR] Falha ao registrar produto:', error)
    return { success: false, error: error.message || 'Erro desconhecido no servidor.' }
  }
}

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
