import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createWebhookAdminClient } from '@/utils/supabase/webhook';

const MP_API_BASE = 'https://api.mercadopago.com';

interface ItemMetadado {
  item_cardapio_id: string;
  quantidade: number;
}

interface MetadataPedido {
  slug?: string;
  restauranteId?: string;
  restaurante_id?: string;
  dadosCliente?: unknown;
  dados_cliente?: unknown;
  itens?: unknown;
  metodoPagamento?: 'PIX' | 'CARTAO';
  metodo_pagamento?: 'PIX' | 'CARTAO';
}

interface ItemCardapioPrecificado {
  id: string;
  preco_venda: number;
}

type NivelLogWebhook = 'info' | 'sucesso' | 'alerta' | 'erro';

interface ParamsRegistrarLogWebhook {
  supabase: ReturnType<typeof createWebhookAdminClient>;
  idCorrelacao: string;
  etapa: string;
  nivel: NivelLogWebhook;
  mensagem: string;
  restauranteId?: string | null;
  paymentId?: string | null;
  tipoEvento?: string | null;
  dados?: Record<string, unknown>;
  erro?: unknown;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro interno desconhecido.';
}

function serializarErro(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      nome: error.name,
      mensagem: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'object' && error !== null) {
    return { ...error as Record<string, unknown> };
  }

  return { valor: String(error) };
}

function interpretarJsonMetadado<T>(valor: unknown): T | null {
  if (valor == null) {
    return null;
  }

  if (typeof valor === 'string') {
    const texto = valor.trim();
    if (!texto) {
      return null;
    }

    try {
      return JSON.parse(texto) as T;
    } catch {
      return null;
    }
  }

  if (typeof valor === 'object') {
    return valor as T;
  }

  return null;
}

function resumirMetadadosPagamento(metadata: MetadataPedido) {
  const dadosClienteBruto = metadata.dadosCliente;
  const itensBruto = metadata.itens;
  const dadosClienteParseado = interpretarJsonMetadado<Record<string, unknown>>(dadosClienteBruto);
  const itensParseados = interpretarJsonMetadado<ItemMetadado[]>(itensBruto);

  return {
    chaves_metadata: Object.keys(metadata),
    slug_presente: typeof metadata.slug === 'string' && metadata.slug.trim().length > 0,
    tipo_dados_cliente: dadosClienteBruto == null ? 'ausente' : typeof dadosClienteBruto,
    tamanho_dados_cliente_texto: typeof dadosClienteBruto === 'string' ? dadosClienteBruto.length : null,
    dados_cliente_parseado_valido: Boolean(dadosClienteParseado && typeof dadosClienteParseado === 'object'),
    dados_cliente_campos: dadosClienteParseado ? Object.keys(dadosClienteParseado) : [],
    dados_cliente_tem_nome: typeof dadosClienteParseado?.nome === 'string',
    dados_cliente_tem_telefone: typeof dadosClienteParseado?.telefone === 'string',
    tipo_itens: itensBruto == null ? 'ausente' : typeof itensBruto,
    tamanho_itens_texto: typeof itensBruto === 'string' ? itensBruto.length : null,
    itens_parseados_valido: Array.isArray(itensParseados),
    itens_quantidade: Array.isArray(itensParseados) ? itensParseados.length : 0,
  };
}

function registrarConsoleWebhook({
  idCorrelacao,
  etapa,
  nivel,
  mensagem,
  restauranteId,
  paymentId,
  tipoEvento,
  dados,
  erro,
}: Omit<ParamsRegistrarLogWebhook, 'supabase'>) {
  const payloadLog = {
    contexto: 'webhook_pagamentos',
    timestamp: new Date().toISOString(),
    id_correlacao: idCorrelacao,
    etapa,
    nivel,
    mensagem,
    restaurante_id: restauranteId ?? null,
    payment_id: paymentId ?? null,
    tipo_evento: tipoEvento ?? null,
    dados: dados ?? {},
    erro: erro ? serializarErro(erro) : null,
  };

  const textoLog = JSON.stringify(payloadLog);
  if (nivel === 'erro') {
    console.error(textoLog);
    return;
  }

  if (nivel === 'alerta') {
    console.warn(textoLog);
    return;
  }

  console.log(textoLog);
}

async function registrarLogWebhook(params: ParamsRegistrarLogWebhook) {
  const {
    supabase,
    idCorrelacao,
    etapa,
    nivel,
    mensagem,
    restauranteId,
    paymentId,
    tipoEvento,
    dados,
    erro,
  } = params;

  registrarConsoleWebhook({
    idCorrelacao,
    etapa,
    nivel,
    mensagem,
    restauranteId,
    paymentId,
    tipoEvento,
    dados,
    erro,
  });

  const { error: erroInsercaoLog } = await supabase.from('logs_webhook_pagamentos').insert({
    id_correlacao: idCorrelacao,
    restaurante_id: restauranteId ?? null,
    payment_id: paymentId ?? null,
    tipo_evento: tipoEvento ?? null,
    etapa,
    nivel,
    mensagem,
    dados_json: dados ?? {},
    erro_json: erro ? serializarErro(erro) : null,
  });

  if (erroInsercaoLog) {
    console.error(
      JSON.stringify({
        contexto: 'webhook_pagamentos',
        timestamp: new Date().toISOString(),
        id_correlacao: idCorrelacao,
        etapa: 'persistencia_log',
        nivel: 'erro',
        mensagem: 'Falha ao persistir log na tabela logs_webhook_pagamentos.',
        erro: {
          codigo: erroInsercaoLog.code,
          mensagem: erroInsercaoLog.message,
          detalhe: erroInsercaoLog.details,
          hint: erroInsercaoLog.hint,
        },
      })
    );
  }
}

async function buscarPagamentoMercadoPago(accessToken: string, paymentId: string) {
  const response = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || `Falha ao consultar pagamento ${paymentId}.`);
  }

  return payload as {
    id: string;
    status: string;
    payment_method_id?: string;
    metadata?: MetadataPedido;
    external_reference?: string;
    transaction_amount?: number;
  };
}

function validarItens(itens: ItemMetadado[]) {
  return itens.every(
    (item) =>
      typeof item.item_cardapio_id === 'string' &&
      item.item_cardapio_id.length > 0 &&
      Number.isInteger(item.quantidade) &&
      item.quantidade > 0
  );
}

async function extrairCorpo(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const supabase = createWebhookAdminClient();
  const idCorrelacao = randomUUID();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    await registrarLogWebhook({
      supabase,
      idCorrelacao,
      etapa: 'validacao_configuracao',
      nivel: 'erro',
      mensagem: 'Webhook interrompido por ausência de NEXT_PUBLIC_APP_URL.',
    });
    return NextResponse.json({ error: 'URL pública da aplicação não configurada.' }, { status: 500 });
  }

  let etapaAtual = 'inicio';

  try {
    etapaAtual = 'recebimento_webhook';
    const body = await extrairCorpo(request);
    const dataId = body?.data?.id ?? body?.id ?? null;
    const tipo = body?.type ?? body?.topic ?? body?.action ?? null;
    const restauranteId = String(
      new URL(request.url).searchParams.get('restaurante_id') ?? body?.restaurante_id ?? ''
    ).trim();
    const paymentIdNotificacao = dataId ? String(dataId) : null;

    await registrarLogWebhook({
      supabase,
      idCorrelacao,
      etapa: etapaAtual,
      nivel: 'info',
      mensagem: 'Notificação recebida no webhook de pagamentos.',
      restauranteId: restauranteId || null,
      paymentId: paymentIdNotificacao,
      tipoEvento: tipo ? String(tipo) : null,
      dados: {
        possui_data_id: Boolean(dataId),
        possui_restaurante_id: Boolean(restauranteId),
      },
    });

    if (!dataId) {
      await registrarLogWebhook({
        supabase,
        idCorrelacao,
        etapa: 'validacao_notificacao',
        nivel: 'alerta',
        mensagem: 'Notificação recebida sem identificador de pagamento.',
        restauranteId: restauranteId || null,
        tipoEvento: tipo ? String(tipo) : null,
      });
      return NextResponse.json({ error: 'Notificação sem identificador de pagamento.' }, { status: 400 });
    }

    if (!restauranteId) {
      await registrarLogWebhook({
        supabase,
        idCorrelacao,
        etapa: 'validacao_notificacao',
        nivel: 'alerta',
        mensagem: 'Notificação recebida sem restaurante_id.',
        paymentId: String(dataId),
        tipoEvento: tipo ? String(tipo) : null,
      });
      return NextResponse.json({ error: 'restaurante_id ausente na notificação.' }, { status: 400 });
    }

    if (tipo && !String(tipo).toLowerCase().includes('payment')) {
      await registrarLogWebhook({
        supabase,
        idCorrelacao,
        etapa: 'filtro_evento',
        nivel: 'info',
        mensagem: 'Evento ignorado por não ser relacionado a pagamento.',
        restauranteId,
        paymentId: String(dataId),
        tipoEvento: String(tipo),
      });
      return NextResponse.json({ received: true });
    }

    etapaAtual = 'resolucao_token_integracao';
    const { data: integracao, error: errIntegracao } = await supabase
      .from('restaurante_integracoes_pagamento')
      .select('access_token, connection_status')
      .eq('restaurante_id', restauranteId)
      .maybeSingle();

    if (errIntegracao || !integracao?.access_token || integracao.connection_status !== 'conectado') {
      await registrarLogWebhook({
        supabase,
        idCorrelacao,
        etapa: etapaAtual,
        nivel: 'erro',
        mensagem: 'Integração Mercado Pago indisponível para o restaurante.',
        restauranteId,
        paymentId: String(dataId),
        dados: {
          connection_status: integracao?.connection_status ?? null,
        },
        erro: errIntegracao,
      });
      return NextResponse.json({ error: 'Integração Mercado Pago indisponível.' }, { status: 409 });
    }

    etapaAtual = 'consulta_pagamento_mercado_pago';
    const pagamento = await buscarPagamentoMercadoPago(integracao.access_token, String(dataId));
    await registrarLogWebhook({
      supabase,
      idCorrelacao,
      etapa: etapaAtual,
      nivel: 'info',
      mensagem: 'Pagamento consultado com sucesso no Mercado Pago.',
      restauranteId,
      paymentId: String(pagamento.id),
      dados: {
        status_pagamento: pagamento.status,
      },
    });

    if (pagamento.status !== 'approved') {
      await registrarLogWebhook({
        supabase,
        idCorrelacao,
        etapa: 'validacao_status_pagamento',
        nivel: 'info',
        mensagem: 'Pagamento ainda não aprovado; webhook encerrado sem conciliação.',
        restauranteId,
        paymentId: String(pagamento.id),
        dados: {
          status_pagamento: pagamento.status,
        },
      });
      return NextResponse.json({ received: true });
    }

    etapaAtual = 'leitura_metadados_pagamento';
    const metadata = pagamento.metadata ?? {};
    const slug = String(metadata.slug ?? '').trim();
    const dadosCliente = interpretarJsonMetadado<Record<string, unknown>>(
      metadata.dadosCliente ?? metadata.dados_cliente
    );
    const itens = interpretarJsonMetadado<ItemMetadado[]>(metadata.itens) ?? [];
    const diagnosticoMetadados = resumirMetadadosPagamento(metadata);

    await registrarLogWebhook({
      supabase,
      idCorrelacao,
      etapa: 'diagnostico_metadados_pagamento',
      nivel: 'info',
      mensagem: 'Resumo técnico dos metadados recebidos do Mercado Pago.',
      restauranteId,
      paymentId: String(pagamento.id),
      dados: diagnosticoMetadados,
    });

    if (!slug) {
      await registrarLogWebhook({
        supabase,
        idCorrelacao,
        etapa: etapaAtual,
        nivel: 'alerta',
        mensagem: 'Pagamento aprovado sem slug nos metadados.',
        restauranteId,
        paymentId: String(pagamento.id),
      });
      return NextResponse.json({ error: 'Slug do restaurante ausente nos metadados.' }, { status: 400 });
    }

    if (!dadosCliente || typeof dadosCliente.nome !== 'string' || typeof dadosCliente.telefone !== 'string') {
      await registrarLogWebhook({
        supabase,
        idCorrelacao,
        etapa: etapaAtual,
        nivel: 'alerta',
        mensagem: 'Dados do cliente inválidos nos metadados do pagamento.',
        restauranteId,
        paymentId: String(pagamento.id),
      });
      return NextResponse.json({ error: 'Dados do cliente inválidos.' }, { status: 400 });
    }

    if (!Array.isArray(itens) || itens.length === 0 || !validarItens(itens)) {
      await registrarLogWebhook({
        supabase,
        idCorrelacao,
        etapa: etapaAtual,
        nivel: 'alerta',
        mensagem: 'Itens inválidos nos metadados do pagamento.',
        restauranteId,
        paymentId: String(pagamento.id),
      });
      return NextResponse.json({ error: 'Itens do pagamento inválidos.' }, { status: 400 });
    }

    etapaAtual = 'busca_restaurante_por_slug';
    const { data: restaurante, error: errRestaurante } = await supabase
      .from('restaurantes')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (errRestaurante || !restaurante) {
      await registrarLogWebhook({
        supabase,
        idCorrelacao,
        etapa: etapaAtual,
        nivel: 'erro',
        mensagem: 'Restaurante não localizado para o slug do pagamento.',
        restauranteId,
        paymentId: String(pagamento.id),
        dados: { slug },
        erro: errRestaurante,
      });
      return NextResponse.json({ error: 'Restaurante não localizado.' }, { status: 404 });
    }

    etapaAtual = 'busca_precos_itens';
    const idsProdutos = itens.map((item) => item.item_cardapio_id);
    const { data: produtosBanco, error: errProdutos } = await supabase
      .from('itens_cardapio')
      .select('id, preco_venda')
      .eq('restaurante_id', restaurante.id)
      .in('id', idsProdutos);

    if (errProdutos || !produtosBanco || produtosBanco.length !== idsProdutos.length) {
      await registrarLogWebhook({
        supabase,
        idCorrelacao,
        etapa: etapaAtual,
        nivel: 'erro',
        mensagem: 'Falha na recuperação de preços para conciliação do pedido.',
        restauranteId: restaurante.id,
        paymentId: String(pagamento.id),
        dados: {
          quantidade_itens_metadados: idsProdutos.length,
          quantidade_itens_encontrados: produtosBanco?.length ?? 0,
        },
        erro: errProdutos,
      });
      return NextResponse.json({ error: 'Falha ao recuperar preços vigentes.' }, { status: 400 });
    }

    const produtos = produtosBanco as ItemCardapioPrecificado[];
    const valorTotal = itens.reduce((acc, item) => {
      const prod = produtos.find((p) => p.id === item.item_cardapio_id);
      if (!prod) {
        return acc;
      }
      return acc + Number(prod.preco_venda) * item.quantidade;
    }, 0);

    const pedidoExistente = await supabase
      .from('pedidos')
      .select('id')
      .eq('restaurante_id', restaurante.id)
      .eq('fb_click_id', String(pagamento.id))
      .maybeSingle();

    if (pedidoExistente.data) {
      await registrarLogWebhook({
        supabase,
        idCorrelacao,
        etapa: 'idempotencia_conciliacao',
        nivel: 'info',
        mensagem: 'Pagamento já conciliado anteriormente; webhook ignorado.',
        restauranteId: restaurante.id,
        paymentId: String(pagamento.id),
        dados: { pedido_id_existente: pedidoExistente.data.id },
      });
      return NextResponse.json({ received: true });
    }

    const formaPagamento = String(
      pagamento.payment_method_id || metadata.metodoPagamento || metadata.metodo_pagamento || 'CARTAO'
    ).toUpperCase() === 'PIX'
      ? 'PIX'
      : 'CARTAO';

    etapaAtual = 'criacao_pedido';
    const { data: novoPedido, error: errPedido } = await supabase
      .from('pedidos')
      .insert([
        {
          restaurante_id: restaurante.id,
          status: 'PAGO',
          valor_total: Math.round(valorTotal * 100) / 100,
          forma_pagamento: formaPagamento,
          dados_cliente: dadosCliente,
          fb_click_id: String(pagamento.id),
        },
      ])
      .select()
      .single();

    if (errPedido || !novoPedido) {
      throw errPedido || new Error('Erro ao criar pedido.');
    }

    await registrarLogWebhook({
      supabase,
      idCorrelacao,
      etapa: etapaAtual,
      nivel: 'sucesso',
      mensagem: 'Pedido criado com sucesso na conciliação do webhook.',
      restauranteId: restaurante.id,
      paymentId: String(pagamento.id),
      dados: {
        pedido_id: novoPedido.id,
        valor_total: Math.round(valorTotal * 100) / 100,
        forma_pagamento: formaPagamento,
      },
    });

    const linhasItens = itens.map((item) => {
      const prod = produtos.find((p) => p.id === item.item_cardapio_id);
      return {
        pedido_id: novoPedido.id,
        item_cardapio_id: item.item_cardapio_id,
        quantidade: item.quantidade,
        preco_unitario: prod ? Number(prod.preco_venda) : 0,
      };
    });

    etapaAtual = 'criacao_itens_pedido';
    const { error: errItens } = await supabase.from('itens_pedido').insert(linhasItens);
    if (errItens) {
      throw errItens;
    }

    await registrarLogWebhook({
      supabase,
      idCorrelacao,
      etapa: etapaAtual,
      nivel: 'sucesso',
      mensagem: 'Itens do pedido inseridos com sucesso.',
      restauranteId: restaurante.id,
      paymentId: String(pagamento.id),
      dados: {
        quantidade_linhas_itens: linhasItens.length,
      },
    });

    etapaAtual = 'busca_composicoes_produtos';
    const { data: composicoes, error: errCompo } = await supabase
      .from('composicao_produto')
      .select('item_cardapio_id, insumo_id, quantidade_necessaria')
      .in('item_cardapio_id', idsProdutos);

    if (errCompo) {
      throw new Error(`Falha ao carregar composição dos produtos: ${errCompo.message}`);
    }

    etapaAtual = 'deducao_estoque';
    let totalDeduzes = 0;
    if (composicoes) {
      const quantidadePorItem = new Map(itens.map((item) => [item.item_cardapio_id, item.quantidade]));

      for (const comp of composicoes) {
        const qtdVendidaDoProduto = quantidadePorItem.get(comp.item_cardapio_id) || 0;
        const quantidadeTotalDeduzir = Number(comp.quantidade_necessaria) * qtdVendidaDoProduto;

        if (quantidadeTotalDeduzir > 0) {
          const { error: errDeduzir } = await supabase.rpc('deduzir_estoque_insumo', {
            p_insumo_id: comp.insumo_id,
            p_quantidade: quantidadeTotalDeduzir,
          });

          if (errDeduzir) {
            throw new Error(`Falha ao deduzir estoque: ${errDeduzir.message}`);
          }

          totalDeduzes += 1;
        }
      }
    }

    await registrarLogWebhook({
      supabase,
      idCorrelacao,
      etapa: etapaAtual,
      nivel: 'sucesso',
      mensagem: 'Dedução de estoque concluída.',
      restauranteId: restaurante.id,
      paymentId: String(pagamento.id),
      dados: {
        total_operacoes_deducao: totalDeduzes,
      },
    });

    etapaAtual = 'atualizacao_funil';
    const hoje = new Date().toISOString().split('T')[0];
    const { error: errFunil } = await supabase.rpc('incrementar_compras_funil', {
      p_restaurante_id: restaurante.id,
      p_data: hoje,
    });

    if (errFunil) {
      throw new Error(`Falha ao atualizar métricas de funil: ${errFunil.message}`);
    }

    await registrarLogWebhook({
      supabase,
      idCorrelacao,
      etapa: 'finalizacao_conciliacao',
      nivel: 'sucesso',
      mensagem: 'Pedido conciliado com sucesso via webhook Mercado Pago.',
      restauranteId: restaurante.id,
      paymentId: String(pagamento.id),
      dados: {
        pedido_id: novoPedido.id,
        data_referencia_funil: hoje,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    await registrarLogWebhook({
      supabase,
      idCorrelacao,
      etapa: etapaAtual,
      nivel: 'erro',
      mensagem: 'Erro interno durante processamento do webhook Mercado Pago.',
      erro: error,
    });

    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
