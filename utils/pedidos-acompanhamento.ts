import { randomUUID } from 'node:crypto';
import { createWebhookAdminClient } from '@/utils/supabase/webhook';
import { enviarNotificacoesStatusPedido, type PedidoParaNotificacao } from '@/utils/notificacoes-pedido';
import {
  type DadosClientePedido,
  type StatusPedido,
  formatarEnderecoPedido,
  obterTipoEntregaPedido,
} from '@/utils/pedido-status';

interface ItemPedidoInput {
  item_cardapio_id: string;
  quantidade: number;
  preco_unitario: number;
}

interface PedidoPublicoLinhaBruta {
  id: string;
  quantidade: number;
  preco_unitario: number;
  itens_cardapio: Array<{
    nome: string;
    imagem_url?: string | null;
  }> | null;
}

interface RestauranteRelacionadoBruto {
  nome: string;
  slug: string;
  endereco?: string | null;
}

interface PedidoPublicoBruto {
  id: string;
  status: StatusPedido;
  valor_total: number;
  forma_pagamento: string;
  dados_cliente: DadosClientePedido;
  created_at: string;
  updated_at: string;
  codigo_acompanhamento: string;
  mercado_pago_payment_id?: string | null;
  restaurantes: RestauranteRelacionadoBruto | RestauranteRelacionadoBruto[] | null;
  itens_pedido: PedidoPublicoLinhaBruta[] | null;
}

export interface PedidoPublico {
  id: string;
  status: StatusPedido;
  valor_total: number;
  forma_pagamento: string;
  created_at: string;
  updated_at: string;
  codigo_acompanhamento: string;
  mercado_pago_payment_id: string | null;
  dados_cliente: DadosClientePedido;
  endereco_entrega: string | null;
  restaurante: {
    nome: string;
    slug: string;
    endereco: string | null;
  };
  itens: Array<{
    id: string;
    nome: string;
    imagem_url: string | null;
    quantidade: number;
    preco_unitario: number;
  }>;
}

function getSupabase() {
  return createWebhookAdminClient();
}

export function gerarCodigoAcompanhamentoPedido() {
  return randomUUID().replace(/-/g, '');
}

export function gerarExternalReferencePedido(restauranteId: string, codigoAcompanhamento: string) {
  return `pedido_${restauranteId}_${codigoAcompanhamento}`;
}

function normalizarPedidoPublico(bruto: PedidoPublicoBruto): PedidoPublico {
  const restaurante = Array.isArray(bruto.restaurantes) ? bruto.restaurantes[0] : bruto.restaurantes;

  return {
    id: bruto.id,
    status: bruto.status,
    valor_total: Number(bruto.valor_total),
    forma_pagamento: bruto.forma_pagamento,
    created_at: bruto.created_at,
    updated_at: bruto.updated_at,
    codigo_acompanhamento: bruto.codigo_acompanhamento,
    mercado_pago_payment_id: bruto.mercado_pago_payment_id ?? null,
    dados_cliente: bruto.dados_cliente,
    endereco_entrega: formatarEnderecoPedido(bruto.dados_cliente),
    restaurante: {
      nome: restaurante?.nome ?? 'Restaurante',
      slug: restaurante?.slug ?? '',
      endereco: restaurante?.endereco ?? null,
    },
    itens: (bruto.itens_pedido ?? []).map((item) => ({
      id: item.id,
      nome: item.itens_cardapio?.[0]?.nome ?? 'Item',
      imagem_url: item.itens_cardapio?.[0]?.imagem_url ?? null,
      quantidade: Number(item.quantidade),
      preco_unitario: Number(item.preco_unitario),
    })),
  };
}

export async function criarPedidoPendente(params: {
  restauranteId: string;
  formaPagamento: string;
  dadosCliente: DadosClientePedido;
  itens: ItemPedidoInput[];
  valorTotal: number;
  externalReference: string;
}) {
  const supabase = getSupabase();
  const codigoAcompanhamento = gerarCodigoAcompanhamentoPedido();
  const agora = new Date().toISOString();

  const { data: pedido, error: errPedido } = await supabase
    .from('pedidos')
    .insert([
      {
        restaurante_id: params.restauranteId,
        status: 'PENDENTE',
        valor_total: Math.round(params.valorTotal * 100) / 100,
        forma_pagamento: params.formaPagamento,
        dados_cliente: params.dadosCliente,
        codigo_acompanhamento: codigoAcompanhamento,
        mercado_pago_external_reference: params.externalReference,
        updated_at: agora,
      },
    ])
    .select('id, codigo_acompanhamento, mercado_pago_external_reference')
    .single();

  if (errPedido || !pedido) {
    throw errPedido || new Error('Falha ao criar pedido pendente.');
  }

  const linhasItens = params.itens.map((item) => ({
    pedido_id: pedido.id,
    item_cardapio_id: item.item_cardapio_id,
    quantidade: item.quantidade,
    preco_unitario: item.preco_unitario,
  }));

  const { error: errItens } = await supabase.from('itens_pedido').insert(linhasItens);
  if (errItens) {
    await supabase.from('pedidos').delete().eq('id', pedido.id);
    throw errItens;
  }

  return {
    id: pedido.id,
    codigoAcompanhamento: pedido.codigo_acompanhamento as string,
    externalReference: pedido.mercado_pago_external_reference as string,
  };
}

export async function buscarPedidoPublicoPorToken(slug: string, token: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      id,
      status,
      valor_total,
      forma_pagamento,
      dados_cliente,
      created_at,
      updated_at,
      codigo_acompanhamento,
      mercado_pago_payment_id,
      restaurantes ( nome, slug, endereco ),
      itens_pedido ( id, quantidade, preco_unitario, itens_cardapio ( nome, imagem_url ) )
    `)
    .eq('codigo_acompanhamento', token)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const pedido = normalizarPedidoPublico(data as unknown as PedidoPublicoBruto);
  if (pedido.restaurante.slug !== slug) {
    return null;
  }

  return pedido;
}

export async function buscarPedidoInternoPorId(pedidoId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      id,
      status,
      valor_total,
      forma_pagamento,
      dados_cliente,
      created_at,
      updated_at,
      codigo_acompanhamento,
      mercado_pago_payment_id,
      restaurante_id,
      restaurantes ( nome, slug, endereco ),
      itens_pedido ( id, quantidade, preco_unitario, item_cardapio_id, itens_cardapio ( nome, imagem_url ) )
    `)
    .eq('id', pedidoId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as unknown as PedidoPublicoBruto & { restaurante_id: string };
}

export async function buscarPedidoPorExternalReference(externalReference: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('pedidos')
    .select('id, status, mercado_pago_payment_id, restaurante_id, codigo_acompanhamento')
    .eq('mercado_pago_external_reference', externalReference)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as {
    id: string;
    status: StatusPedido;
    mercado_pago_payment_id?: string | null;
    restaurante_id: string;
    codigo_acompanhamento: string;
  };
}

async function processarEfeitosColateraisPagamentoAprovado(pedidoId: string, restauranteId: string) {
  const supabase = getSupabase();
  const { data: itensPedido, error: errItensPedido } = await supabase
    .from('itens_pedido')
    .select('item_cardapio_id, quantidade')
    .eq('pedido_id', pedidoId);

  if (errItensPedido) {
    throw errItensPedido;
  }

  const idsProdutos = (itensPedido ?? []).map((item) => item.item_cardapio_id as string);
  if (idsProdutos.length === 0) {
    return;
  }

  const { data: composicoes, error: errCompo } = await supabase
    .from('composicao_produto')
    .select('item_cardapio_id, insumo_id, quantidade_necessaria')
    .in('item_cardapio_id', idsProdutos);

  if (errCompo) {
    throw new Error(`Falha ao carregar composição dos produtos: ${errCompo.message}`);
  }

  const quantidadePorItem = new Map(
    (itensPedido ?? []).map((item) => [String(item.item_cardapio_id), Number(item.quantidade)])
  );

  for (const comp of composicoes ?? []) {
    const qtdVendidaDoProduto = quantidadePorItem.get(String(comp.item_cardapio_id)) || 0;
    const quantidadeTotalDeduzir = Number(comp.quantidade_necessaria) * qtdVendidaDoProduto;
    if (quantidadeTotalDeduzir <= 0) {
      continue;
    }

    const { error: errDeduzir } = await supabase.rpc('deduzir_estoque_insumo', {
      p_insumo_id: comp.insumo_id,
      p_quantidade: quantidadeTotalDeduzir,
    });

    if (errDeduzir) {
      throw new Error(`Falha ao deduzir estoque: ${errDeduzir.message}`);
    }
  }

  const hoje = new Date().toISOString().split('T')[0];
  const { error: errFunil } = await supabase.rpc('incrementar_compras_funil', {
    p_restaurante_id: restauranteId,
    p_data: hoje,
  });

  if (errFunil) {
    throw new Error(`Falha ao atualizar métricas de funil: ${errFunil.message}`);
  }
}

function mapearPedidoParaNotificacao(pedido: PedidoPublicoBruto): PedidoParaNotificacao {
  const restaurante = Array.isArray(pedido.restaurantes) ? pedido.restaurantes[0] : pedido.restaurantes;

  return {
    id: pedido.id,
    status: pedido.status,
    codigoAcompanhamento: pedido.codigo_acompanhamento,
    dadosCliente: pedido.dados_cliente,
    restaurante: {
      nome: restaurante?.nome ?? 'Restaurante',
      slug: restaurante?.slug ?? '',
    },
  };
}

export async function atualizarStatusPedidoComNotificacoes(params: {
  pedidoId: string;
  novoStatus: StatusPedido;
  mercadoPagoPaymentId?: string | null;
}) {
  const supabase = getSupabase();
  const pedidoAtual = await buscarPedidoInternoPorId(params.pedidoId);

  if (!pedidoAtual) {
    throw new Error('Pedido não encontrado para atualização de status.');
  }

  const statusAnterior = pedidoAtual.status;
  const mudouStatus = statusAnterior !== params.novoStatus;
  const precisaAtualizarPagamentoId = params.mercadoPagoPaymentId && pedidoAtual.mercado_pago_payment_id !== params.mercadoPagoPaymentId;

  if (!mudouStatus && !precisaAtualizarPagamentoId) {
    return {
      mudouStatus: false,
      pedido: normalizarPedidoPublico(pedidoAtual),
    };
  }

  const payloadAtualizacao: Record<string, unknown> = {
    status: params.novoStatus,
    updated_at: new Date().toISOString(),
  };

  if (params.mercadoPagoPaymentId) {
    payloadAtualizacao.mercado_pago_payment_id = params.mercadoPagoPaymentId;
  }

  const { error: errUpdate } = await supabase
    .from('pedidos')
    .update(payloadAtualizacao)
    .eq('id', params.pedidoId);

  if (errUpdate) {
    throw errUpdate;
  }

  if (params.novoStatus === 'PAGO' && statusAnterior !== 'PAGO') {
    await processarEfeitosColateraisPagamentoAprovado(params.pedidoId, pedidoAtual.restaurante_id);
  }

  const pedidoAtualizado = await buscarPedidoInternoPorId(params.pedidoId);
  if (!pedidoAtualizado) {
    throw new Error('Pedido atualizado não localizado.');
  }

  if (mudouStatus) {
    await enviarNotificacoesStatusPedido(mapearPedidoParaNotificacao(pedidoAtualizado));
  }

  return {
    mudouStatus,
    pedido: normalizarPedidoPublico(pedidoAtualizado),
  };
}

export function obterResumoPedidoPublico(pedido: PedidoPublico) {
  const tipoEntrega = obterTipoEntregaPedido(pedido.dados_cliente);
  return {
    ...pedido,
    tipo_entrega: tipoEntrega,
  };
}
