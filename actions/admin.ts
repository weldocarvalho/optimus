// actions/admin.ts

'use server';
import { supabase } from '@/lib/supabase';
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

const RESTAURANTE_ID_TESTE = (async () => {
  const { data } = await supabase.from('restaurantes').select('id').eq('slug', 'acelera-burger').single();
  return data?.id;
});

export async function listarProdutosComCMV(): Promise<ItemCardapioComCMV[]> {
  const restauranteId = await RESTAURANTE_ID_TESTE();
  
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
}

// NOVA FUNÇÃO: Atualiza a disponibilidade de múltiplos produtos de uma vez
export async function atualizarStatusEmLote(ids: string[], disponivel: boolean) {
  if (ids.length === 0) return { success: true };

  const { error } = await supabase
    .from('itens_cardapio')
    .update({ disponivel })
    .in('id', ids);

  if (error) {
    console.error('Erro ao atualizar produtos em lote:', error);
    return { success: false, error };
  }

  return { success: true };
}

// export async function criarProdutoAdmin(nome: string, descricao: string, precoVenda: number) {
//   const restauranteId = await RESTAURANTE_ID_TESTE();
  
//   if (!nome || precoVenda <= 0) {
//     return { success: false, error: 'Nome e preço de venda são obrigatórios.' };
//   }

//   const { error } = await supabase
//     .from('itens_cardapio')
//     .insert([
//       {
//         restaurante_id: restauranteId,
//         nome,
//         descricao: descricao || null,
//         preco_venda: precoVenda,
//         disponivel: true
//       }
//     ]);

//   if (error) {
//     console.error('Erro ao criar novo produto:', error);
//     return { success: false, error };
//   }

//   return { success: true };
// }

// actions/admin.ts
// ... (mantenha os imports e funções anteriores)

export interface InsumoVinculadoInput {
  insumo_id: string;
  quantidade_necessaria: number;
}

export async function criarProdutoComFichaTecnica(
  nome: string, 
  descricao: string, 
  precoVenda: number, 
  insumosVinculados: InsumoVinculadoInput[]
) {
  const restauranteId = await RESTAURANTE_ID_TESTE();
  
  if (!nome || precoVenda <= 0) {
    return { success: false, error: 'Nome e preço de venda são obrigatórios.' };
  }

  // 1. Insere o item do cardápio e captura o ID gerado
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
      // Nota: Em produção usaríamos transações RPC para dar rollback, mantendo simples para o MVP
      return { success: false, error: 'Produto criado, mas houve falha ao salvar a ficha técnica.' };
    }
  }

  return { success: true };
}


export async function alternarDisponibilidadeProduto(id: string, statusAtual: boolean) {
  const { error } = await supabase
    .from('itens_cardapio')
    .update({ disponivel: !statusAtual }) // Inverte o booleano (se está true, vira false e vice-versa)
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar status do produto:', error);
    return { success: false, error };
  }

  return { success: true };
}
