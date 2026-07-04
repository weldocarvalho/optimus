// actions/admin.ts

'use server';

import { createClient } from '@/utils/supabase/server';
import { ItemCardapio } from '@/types/database';

export interface IngredienteDetalhado {
  nome: string;
  quantidade: number;
  unidade: string;
}

export interface ItemCardapioComCMV extends ItemCardapio {
  custo_producao: number;
  margem_lucro: number;
  percentual_cmv: number;
  ingredientes: IngredienteDetalhado[];
}

export interface InsumoVinculadoInput {
  insumo_id: string;
  quantidade_necessaria: number;
}

/**
 * Função auxiliar interna para capturar o restaurante_id do gestor autenticado
 * usando a tabela de amarração baseada na sessão atual.
 */
async function obterRestauranteIdLogado(): Promise<string> {
  const supabase = await createClient();
  
  // Captura o usuário logado direto do JWT seguro do cookie
  const { data: { user }, error: errUser } = await supabase.auth.getUser();
  
  if (errUser || !user) {
    throw new Error('Usuário não autenticado no Centro de Comando.');
  }

  // Busca a amarração do perfil administrativo
  const { data: perfil, error: errPerfil } = await supabase
    .from('perfis_admin')
    .select('restaurante_id')
    .eq('id', user.id)
    .single();

  if (errPerfil || !perfil) {
    throw new Error('Perfil administrativo ou restaurante não localizado.');
  }

  return perfil.restaurante_id;
}

export async function listarProdutosComCMV(): Promise<ItemCardapioComCMV[]> {
  try {
    const supabase = await createClient();
    const restauranteId = await obterRestauranteIdLogado();
    
    const { data: produtos, error } = await supabase
      .from('itens_cardapio')
      .select(`
        *,
        composicao_produto (
          quantidade_necessaria,
          insumos (
            nome,
            unidade_medida,
            custo_unitario
          )
        )
      `)
      .eq('restaurante_id', restauranteId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar produtos com CMV:', error);
      return [];
    }

    return (produtos || []).map((item: any) => {
      let custoProducao = 0;
      const ingredientes: IngredienteDetalhado[] = [];

      if (item.composicao_produto) {
        item.composicao_produto.forEach((comp: any) => {
          const custoUnitario = comp.insumos?.custo_unitario || 0;
          const qtd = Number(comp.quantidade_necessaria);
          custoProducao += qtd * Number(custoUnitario);

          if (comp.insumos) {
            ingredientes.push({
              nome: comp.insumos.nome,
              quantidade: qtd,
              unidade: comp.insumos.unidade_medida
            });
          }
        });
      }

      const precoVenda = Number(item.preco_venda);
      return {
        ...item,
        custo_producao: custoProducao,
        margem_lucro: precoVenda - custoProducao,
        percentual_cmv: precoVenda > 0 ? (custoProducao / precoVenda) * 100 : 0,
        ingredientes
      };
    });
  } catch (error) {
    console.error('Erro na action listarProdutosComCMV:', error);
    return [];
  }
}

export async function atualizarStatusEmLote(ids: string[], disponivel: boolean) {
  if (ids.length === 0) return { success: true };

  try {
    const supabase = await createClient();
    
    // O RLS configurado no banco garante que o usuário só altere itens do seu próprio restaurante_id
    const { error } = await supabase
      .from('itens_cardapio')
      .update({ disponivel })
      .in('id', ids);

    if (error) {
      console.error('Erro ao atualizar produtos em lote:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function criarProdutoComFichaTecnica(
  nome: string, 
  descricao: string, 
  precoVenda: number, 
  insumosVinculados: InsumoVinculadoInput[]
) {
  if (!nome || precoVenda <= 0) {
    return { success: false, error: 'Nome e preço de venda são obrigatórios.' };
  }

  try {
    const supabase = await createClient();
    const restauranteId = await obterRestauranteIdLogado();
    
    // 1. Insere o item do cardápio herdando dinamicamente o ID correto da sessão
    const { data: novoItem, error: errItem } = await supabase
      .from('itens_cardapio')
      .insert([{
        restaurante_id: restauranteId,
        nome,
        descricao: descricao || null,
        preco_venda: precoVenda,
        disponivel: true
      }])
      .select()
      .single();

    if (errItem || !novoItem) {
      console.error('Erro ao criar item do cardápio:', errItem);
      return { success: false, error: 'Falha ao criar o produto.' };
    }

    // 2. Se o usuário vinculou insumos, insere as linhas na tabela de composição
    if (insumosVinculados.length > 0) {
      const linhasComposicao = insumosVinculados.map(ins => ({
        item_cardapio_id: novoItem.id,
        insumo_id: ins.insumo_id,
        quantidade_necessaria: ins.quantidade_necessaria
      }));

      const { error: errComposicao } = await supabase
        .from('composicao_produto')
        .insert(linhasComposicao);

      if (errComposicao) {
        console.error('Erro ao salvar a ficha técnica:', errComposicao);
        return { success: false, error: 'Produto criado, mas houve falha ao salvar a ficha técnica.' };
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function alternarDisponibilidadeProduto(id: string, statusAtual: boolean) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('itens_cardapio')
      .update({ disponivel: !statusAtual })
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar status do produto:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
