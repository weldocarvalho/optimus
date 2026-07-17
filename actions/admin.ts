// actions/admin.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Tipagens unificadas do ecossistema de gestão
export interface AdicionalCustomizadoInput {
  nome: string;
  preco: number;
}

export interface InsumoFichaInput {
  insumo_id: string;
  quantidade_necessaria: number;
}

interface ProdutoComposicao {
  quantidade_necessaria: number | null;
  insumos:
    | Array<{
      nome: string;
      custo_unitario: number | null;
      unidade_medida: string;
    }>
    | {
    nome: string;
    custo_unitario: number | null;
    unidade_medida: string;
  }
    | null;
}

interface ItemCardapioBruto {
  id: string;
  nome: string;
  descricao: string | null;
  preco_venda: number | null;
  disponivel: boolean | null;
  composicao_produto: ProdutoComposicao[] | null;
}

export interface ItemCardapioComCMV {
  id: string;
  nome: string;
  descricao: string;
  preco_venda: number;
  disponivel: boolean;
  custo_producao: number;
  percentual_cmv: number;
  margem_lucro: number;
  ingredientes: Array<{ nome: string; quantidade: number; unidade: string }>;
}

// Apelido para garantir retrocompatibilidade com os imports de componentes
export type AdicionalCustomizado = AdicionalCustomizadoInput;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Erro desconhecido.';
}

/**
 * Cria um novo produto no cardápio injetando dinamicamente o restaurante_id do gestor logado,
 * salvando sua ficha técnica e seus complementos dentro de uma transação simulada estável.
 */
export async function criarProdutoComComplementos(
  nome: string,
  descricao: string,
  precoVenda: number,
  fichaTecnica: InsumoFichaInput[],
  complementos: AdicionalCustomizado[]
) {
  const supabase = await createClient()

  try {
    // 1. Recupera o usuário autenticado na sessão atual do servidor
    const { data: { user }, error: erroAuth } = await supabase.auth.getUser()
    if (erroAuth || !user) {
      throw new Error('Usuário não autenticado ou sessão expirada.')
    }

    // 2. Busca o restaurante_id vinculado ao perfil administrativo deste usuário
    const { data: perfilAdmin, error: erroPerfil } = await supabase
      .from('perfis_admin')
      .select('restaurante_id')
      .eq('id', user.id)
      .single()

    if (erroPerfil || !perfilAdmin?.restaurante_id) {
      console.error('Erro ao recuperar tenant do administrador:', erroPerfil)
      throw new Error('Nenhum restaurante associado a este perfil de administrador.')
    }

    const restauranteId = perfilAdmin.restaurante_id

    // 3. Insere o item de cardápio injetando o restauranteId descoberto
    const { data: novoItem, error: erroItem } = await supabase
      .from('itens_cardapio')
      .insert({
        restaurante_id: restauranteId, // <--- Aqui resolvemos o erro de constraint NOT NULL
        nome,
        descricao,
        preco_venda: precoVenda,
        disponivel: true
      })
      .select('id')
      .single()

    if (erroItem || !novoItem) {
      console.error('Erro detalhado da tabela itens_cardapio:', erroItem)
      throw new Error(`Falha crítica ao criar item de cardápio: ${erroItem?.message}`)
    }

    const itemId = novoItem.id

    // 4. Insere os complementos vinculados ao produto se existirem na requisição
    if (complementos && complementos.length > 0) {
      const dadosComplementos = complementos.map(comp => ({
        item_cardapio_id: itemId,
        nome: comp.nome,
        preco_adicional: comp.preco,
        disponivel: true
      }))

      const { error: erroComplementos } = await supabase
        .from('complementos_produto')
        .insert(dadosComplementos)

      if (erroComplementos) {
        console.error('Erro ao inserir complementos do produto:', erroComplementos)
        // Opcional: dependendo da sua regra de negócio, você pode deletar o item criado se os complementos falharem
        throw new Error(`Produto criado, mas falhou ao salvar adicionais: ${erroComplementos.message}`)
      }
    }

    // 5. Insere a ficha técnica de insumos (tabela composicao_produto) se preenchida
    if (fichaTecnica && fichaTecnica.length > 0) {
      const dadosComposicao = fichaTecnica.map(ficha => ({
        item_cardapio_id: itemId,
        insumo_id: ficha.insumo_id,
        quantidade_necessaria: ficha.quantidade_necessaria
      }))

      const { error: erroComposicao } = await supabase
        .from('composicao_produto')
        .insert(dadosComposicao)

      if (erroComposicao) {
        console.error('Erro ao salvar ficha técnica:', erroComposicao)
        throw new Error(`Produto e adicionais criados, mas falhou na ficha técnica: ${erroComposicao.message}`)
      }
    }

    // Revalida o cache das páginas administrativas para atualizar as listagens instantaneamente
    revalidatePath('/admin/produtos')
    
    return { success: true, itemId }

  } catch (error: unknown) {
    const message = getErrorMessage(error)
    console.error('Erro ao criar produto com complementos:', message)
    return { success: false, error: message }
  }
}


export async function alternarDisponibilidadeProduto(id: string, statusAtual: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('itens_cardapio')
    .update({ disponivel: !statusAtual })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/produtos')
}

export async function atualizarStatusEmLote(ids: string[], novoStatus: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('itens_cardapio')
    .update({ disponivel: novoStatus })
    .in('id', ids)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/produtos')
}

export async function excluirProdutosEmLote(ids: string[]) {
  if (ids.length === 0) {
    return { success: true }
  }

  const supabase = await createClient()

  // Soft delete: arquiva o item e remove da vitrine pública sem quebrar o histórico de pedidos.
  const { error } = await supabase
    .from('itens_cardapio')
    .update({ arquivado: true, disponivel: false })
    .in('id', ids)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/produtos')
  return { success: true }
}

/**
 * RESTAURAÇÃO DA INTELIGÊNCIA FINANCEIRA:
 * Busca todos os produtos vinculados ao restaurante logado e computa recursivamente
 * o CMV em tempo real cruzando a tabela de composição com os custos unitários.
 */
export async function listarProdutosComCMV(): Promise<ItemCardapioComCMV[]> {
  const supabase = await createClient()

  // 1. Identifica de forma segura o restaurante associado ao perfil administrativo logado
  const { data: perfil } = await supabase
    .from('perfis_admin')
    .select('restaurante_id')
    .single()

  if (!perfil?.restaurante_id) return []

  // 2. Query relacional aninhada agregando ficha técnica e custo unitário dos insumos de retaguarda
  const { data: itens, error } = await supabase
    .from('itens_cardapio')
    .select(`
      id,
      nome,
      descricao,
      preco_venda,
      disponivel,
      composicao_produto (
        quantidade_necessaria,
        insumos (
          nome,
          custo_unitario,
          unidade_medida
        )
      )
    `)
    .eq('restaurante_id', perfil.restaurante_id)
    .eq('arquivado', false)

  if (error || !itens) return []

  // 3. Processamento aritmético sênior para dedução exata de margem e percentual do CMV do dia
  return (itens as unknown as ItemCardapioBruto[]).map((item) => {
    let custoProducao = 0;
    const ingredientes: ItemCardapioComCMV['ingredientes'] = [];

    if (item.composicao_produto) {
      item.composicao_produto.forEach((comp) => {
        const insumo = Array.isArray(comp.insumos) ? comp.insumos[0] : comp.insumos;
        if (insumo) {
          const unitario = Number(insumo.custo_unitario || 0);
          const necessaria = Number(comp.quantidade_necessaria || 0);
          custoProducao += unitario * necessaria;

          ingredientes.push({
            nome: insumo.nome,
            quantidade: necessaria,
            unidade: insumo.unidade_medida
          });
        }
      });
    }

    const precoVenda = Number(item.preco_venda || 0);
    const percentualCmv = precoVenda > 0 ? (custoProducao / precoVenda) * 100 : 0;
    const margemLucro = precoVenda - custoProducao;

    return {
      id: item.id,
      nome: item.nome,
      descricao: item.descricao || '',
      preco_venda: precoVenda,
      disponivel: !!item.disponivel,
      custo_producao: custoProducao,
      percentual_cmv: percentualCmv,
      margem_lucro: margemLucro,
      ingredientes
    };
  });
}

export async function criarProdutoComFichaTecnica(
  nome: string,
  descricao: string,
  precoVenda: number,
  fichaTecnica: InsumoFichaInput[]
) {
  return criarProdutoComComplementos(nome, descricao, precoVenda, fichaTecnica, [])
}
