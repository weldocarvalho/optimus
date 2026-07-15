// actions/checkout.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { FormaPagamento } from '@/types/database';

interface ItemPedidoInput {
  item_cardapio_id: string;
  quantidade: number;
  preco_unitario: number;
}

interface DadosClienteInput {
  nome: string;
  telefone: string;
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    cep: string;
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Falha catastrófica no checkout.';
}

export async function processarPedidoCheckout(
  slug: string,
  formaPagamento: FormaPagamento,
  dadosCliente: DadosClienteInput,
  itens: ItemPedidoInput[],
  valorTotal: number
) {
  try {
    const supabase = await createClient();

    if (!slug || itens.length === 0) {
      return { success: false, error: 'Dados do checkout incompletos.' };
    }

    // 1. Descobre o restaurante através do slug da URL
    const { data: restaurante, error: errRestaurante } = await supabase
      .from('restaurantes')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (errRestaurante || !restaurante) {
      return { success: false, error: 'Restaurante inválido ou indisponível.' };
    }

    // 2. Cria o registro mestre do pedido (Status PENDENTE)
    const { data: novoPedido, error: errPedido } = await supabase
      .from('pedidos')
      .insert([{
        restaurante_id: restaurante.id,
        status: 'PENDENTE',
        valor_total: valorTotal,
        forma_pagamento: formaPagamento,
        dados_cliente: dadosCliente
      }])
      .select()
      .single();

    if (errPedido || !novoPedido) {
      console.error('Erro ao criar pedido mestre:', errPedido);
      return { success: false, error: 'Falha ao processar as informações do pedido.' };
    }

    // 3. Cadastra as linhas de itens do pedido
    const linhasItens = itens.map(item => ({
      pedido_id: novoPedido.id,
      item_cardapio_id: item.item_cardapio_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario
    }));

    const { error: errItens } = await supabase
      .from('itens_pedido')
      .insert(linhasItens);

    if (errItens) {
      console.error('Erro ao registrar linhas do pedido:', errItens);
      return { success: false, error: 'Erro ao registrar itens do pedido.' };
    }

    // 4. MÁGICA DO ESTOQUE DEDUTIVO: Puxa todas as receitas necessárias em lote (Fim do N+1)
    const itemIds = itens.map(i => i.item_cardapio_id);
    const { data: composicoes, error: errCompo } = await supabase
      .from('composicao_produto')
      .select('item_cardapio_id, insumo_id, quantidade_necessaria')
      .in('item_cardapio_id', itemIds);

    if (!errCompo && composicoes) {
      // Mapeia os inputs de itens para busca rápida em O(1)
      const quantidadePorItem = new Map(itens.map(i => [i.item_cardapio_id, i.quantidade]));

      for (const comp of composicoes) {
        const qtdVendidaDoProduto = quantidadePorItem.get(comp.item_cardapio_id) || 0;
        const quantidadeTotalDeduzir = Number(comp.quantidade_necessaria) * qtdVendidaDoProduto;
        
        if (quantidadeTotalDeduzir > 0) {
          // Executa a subtração atômica direta via Procedure RPC armazenada no banco
          await supabase.rpc('deduzir_estoque_insumo', {
            p_insumo_id: comp.insumo_id,
            p_quantidade: quantidadeTotalDeduzir
          });
        }
      }
    }

    // 5. ATUALIZAÇÃO DO FUNIL DE CRESCIMENTO (Destaque de Lucratividade)
    const hoje = new Date().toISOString().split('T')[0];
    
    // Incremento atômico de compras concluídas chamando a função nativa RPC correspondente
    await supabase.rpc('incrementar_compras_funil', {
      p_restaurante_id: restaurante.id,
      p_data: hoje
    });

    return { success: true, pedidoId: novoPedido.id };
  } catch (error: unknown) {
    console.error('Erro crítico durante fluxo de processarPedidoCheckout:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}
