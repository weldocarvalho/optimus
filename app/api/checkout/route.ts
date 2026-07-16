import { NextResponse } from 'next/server';
import { createWebhookAdminClient } from '@/utils/supabase/webhook';
import {
  montarMetadataPedido,
  montarNotificationUrlMercadoPago,
  normalizarEmailPayer,
  obterIntegracaoMercadoPagoPorRestauranteId,
  obterTokenMercadoPagoValido,
} from '@/utils/mercado-pago';

const MP_API_BASE = 'https://api.mercadopago.com';

interface ItemCliente {
  item_cardapio_id: string;
  quantidade: number;
}

interface DadosCliente {
  nome: string;
  telefone: string;
  email?: string;
  endereco?: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    cep?: string;
  };
}

interface RequestBody {
  slug: string;
  paymentMethod: 'PIX' | 'CARTAO';
  itens: ItemCliente[];
  dadosCliente: DadosCliente;
}

interface ItemCardapioPrecificado {
  id: string;
  nome: string;
  preco_venda: number;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Falha no servidor de checkout.';
}

async function lerBody(request: Request) {
  try {
    return (await request.json()) as Partial<RequestBody>;
  } catch {
    return {};
  }
}

function validarItens(itens: ItemCliente[]) {
  return itens.every(
    (item) =>
      typeof item.item_cardapio_id === 'string' &&
      item.item_cardapio_id.length > 0 &&
      Number.isInteger(item.quantidade) &&
      item.quantidade > 0
  );
}

export async function POST(request: Request) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json({ error: 'URL pública da aplicação não configurada.' }, { status: 500 });
    }

    const body = await lerBody(request);
    const slug = String(body.slug ?? '').trim();
    const paymentMethod = body.paymentMethod;
    const itens = Array.isArray(body.itens) ? body.itens : [];
    const dadosCliente = (body.dadosCliente ?? {}) as DadosCliente;

    if (!slug || itens.length === 0) {
      return NextResponse.json({ error: 'Dados da requisição inválidos.' }, { status: 400 });
    }

    if (paymentMethod !== 'PIX' && paymentMethod !== 'CARTAO') {
      return NextResponse.json({ error: 'Forma de pagamento inválida.' }, { status: 400 });
    }

    if (!dadosCliente.nome?.trim() || !dadosCliente.telefone?.trim()) {
      return NextResponse.json({ error: 'Dados do cliente inválidos.' }, { status: 400 });
    }

    if (!validarItens(itens)) {
      return NextResponse.json({ error: 'Itens do carrinho inválidos.' }, { status: 400 });
    }

    const supabase = createWebhookAdminClient();
    const { data: restaurante, error: errRestaurante } = await supabase
      .from('restaurantes')
      .select('id, nome, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (errRestaurante || !restaurante) {
      return NextResponse.json({ error: 'Restaurante não encontrado.' }, { status: 404 });
    }

    const idsProdutos = itens.map((item) => item.item_cardapio_id);
    const { data: produtosBanco, error: errProdutos } = await supabase
      .from('itens_cardapio')
      .select('id, nome, preco_venda')
      .eq('restaurante_id', restaurante.id)
      .in('id', idsProdutos);

    if (errProdutos || !produtosBanco || produtosBanco.length !== idsProdutos.length) {
      return NextResponse.json({ error: 'Carrinho vazio ou inválido.' }, { status: 400 });
    }

    const produtos = produtosBanco as ItemCardapioPrecificado[];
    const precoPorItem = new Map(produtos.map((item) => [item.id, Number(item.preco_venda)]));

    const valorTotal = itens.reduce((acc, item) => {
      const preco = precoPorItem.get(item.item_cardapio_id);
      if (!preco) {
        return acc;
      }
      return acc + preco * item.quantidade;
    }, 0);

    if (valorTotal <= 0) {
      return NextResponse.json({ error: 'Valor total inválido.' }, { status: 400 });
    }

    const integracao = await obterIntegracaoMercadoPagoPorRestauranteId(restaurante.id);
    if (!integracao || integracao.connection_status !== 'conectado') {
      return NextResponse.json({ error: 'Mercado Pago não conectado para este restaurante.' }, { status: 409 });
    }

    const accessToken = await obterTokenMercadoPagoValido(restaurante.id);
    const notificationUrl = montarNotificationUrlMercadoPago(appUrl, restaurante.id);
    const metadata = montarMetadataPedido({
      slug,
      restauranteId: restaurante.id,
      metodoPagamento: paymentMethod,
      dadosCliente,
      itens,
    });
    const emailPayer = normalizarEmailPayer(dadosCliente.email, slug, dadosCliente.telefone);
    const externalReference = `pedido-${restaurante.id}-${Date.now()}`;

    if (paymentMethod === 'PIX') {
      const response = await fetch(`${MP_API_BASE}/v1/payments`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          transaction_amount: Number(valorTotal.toFixed(2)),
          description: `${restaurante.nome} - Pedido`,
          payment_method_id: 'pix',
          notification_url: notificationUrl,
          external_reference: externalReference,
          payer: {
            email: emailPayer,
            first_name: dadosCliente.nome.trim().split(/\s+/)[0],
            last_name: dadosCliente.nome.trim().split(/\s+/).slice(1).join(' ') || 'Cliente',
          },
          metadata,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Falha ao gerar pagamento PIX.');
      }

      const transactionData = payload?.point_of_interaction?.transaction_data ?? {};

      return NextResponse.json({
        payment_id: payload.id,
        qr_code: transactionData.qr_code ?? '',
        qr_code_base64: transactionData.qr_code_base64 ?? '',
        ticket_url: transactionData.ticket_url ?? '',
      });
    }

    const preferenceResponse = await fetch(`${MP_API_BASE}/checkout/preferences`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        items: itens.map((item) => ({
          id: item.item_cardapio_id,
          title: produtos.find((produto) => produto.id === item.item_cardapio_id)?.nome ?? 'Produto',
          quantity: item.quantidade,
          unit_price: Number(precoPorItem.get(item.item_cardapio_id) ?? 0),
          currency_id: 'BRL',
        })),
        payer: {
          email: emailPayer,
        },
        external_reference: externalReference,
        notification_url: notificationUrl,
        back_urls: {
          success: `${appUrl}/${slug}?pagamento=aprovado`,
          pending: `${appUrl}/${slug}/checkout?pagamento=pendente`,
          failure: `${appUrl}/${slug}/checkout?pagamento=falhou`,
        },
        auto_return: 'approved',
        metadata,
      }),
    });

    const preferencePayload = await preferenceResponse.json();
    if (!preferenceResponse.ok) {
      throw new Error(preferencePayload?.message || 'Falha ao gerar checkout com cartão.');
    }

    return NextResponse.json({
      preference_id: preferencePayload.id,
      checkout_url: preferencePayload.init_point ?? preferencePayload.sandbox_init_point ?? '',
    });
  } catch (error: unknown) {
    console.error('Erro crítico na rota de checkout Mercado Pago:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
