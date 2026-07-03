// actions/checkout.ts
'use server';

import { supabase } from '@/lib/supabase';
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

export async function processarPedidoCheckout(
  slug: string,
  formaPagamento: FormaPagamento,
  dadosCliente: DadosClienteInput,
  itens: ItemPedidoInput[],
  valorTotal: number
) {
  // 1. Descobre o restaurante através do slug da URL
  const { data: restaurante } = await supabase
    .from('restaurantes')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!restaurante) return { success: false, error: 'Restaurante inválido.' };

  // 2. Cria o registro mestre do pedido (Geralmente PENDENTE até aprovação manual do restaurante)
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
    return { success: false, error: 'Falha ao processar o pedido.' };
  }

  // 3. Cadastra as linhas de itens do pedido
  const linhasItens = itens.map(item => ({
    pedido_id: novoPedido.id,
    item_cardapio_id: item.item_cardapio_id,
    quantidade: item.quantidade,
    preco_unitario: item.preco_unitario
  }));

  const { error: errItens } = await supabase.from('itens_pedido').insert(linhasItens);
  if (errItens) return { success: false, error: 'Erro ao registrar itens do pedido.' };

  // 4. MÁGICA DO ESTOQUE DEDUTIVO: Dá baixa nos insumos com base na Ficha Técnica
  for (const item of itens) {
    // Busca a composição (receita) do prato comprado com o nome correto da coluna
    const { data: composicoes } = await supabase
      .from('composicao_produto')
      .select('insumo_id, quantidade_necessaria')
      .eq('item_cardapio_id', item.item_cardapio_id);

    if (composicoes) {
      for (const comp of composicoes) {
        const quantidadeTotalDeduzir = Number(comp.quantidade_necessaria) * item.quantidade;
        
        // Executa a subtração atômica direto na tabela de insumos do Supabase
        await supabase.rpc('deduzir_estoque_insumo', {
          p_insumo_id: comp.insumo_id,
          p_quantidade: quantidadeTotalDeduzir
        });
      }
    }
  }

  // 5. Atualiza o funil de crescimento para pedidos manuais
  const hoje = new Date().toISOString().split('T')[0];
  await supabase
    .from('metricas_funil')
    .update({ compras_concluidas: supabase.rpc('increment', { row_count: 1 }) as any })
    .eq('restaurante_id', restaurante.id)
    .eq('data', hoje);

  return { success: true, pedidoId: novoPedido.id };
}
