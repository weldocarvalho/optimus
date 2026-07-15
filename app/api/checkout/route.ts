// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

// Inicialização do SDK herdando a versão padrão da conta Stripe de forma segura
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

interface ItemCliente {
  item_cardapio_id: string;
  quantidade: number;
}

interface DadosCliente {
  nome: string;
  telefone: string;
  [key: string]: unknown;
}

interface RequestBody {
  slug: string;
  itens: ItemCliente[];
  dadosCliente: DadosCliente;
}

interface ItemCardapioPrecificado {
  id: string;
  nome: string;
  preco_venda: number;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Falha no servidor de checkout.';
}

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Gateway de pagamento não configurado.' }, { status: 500 });
    }
    if (!appUrl) {
      return NextResponse.json({ error: 'URL pública da aplicação não configurada.' }, { status: 500 });
    }

    const body = (await request.json()) as Partial<RequestBody>;
    const slug = String(body.slug ?? '').trim();
    const itens = Array.isArray(body.itens) ? body.itens : [];
    const dadosCliente = (body.dadosCliente ?? {}) as DadosCliente;

    if (!slug || !itens || itens.length === 0) {
      return NextResponse.json({ error: 'Dados da requisição inválidos.' }, { status: 400 });
    }
    if (!dadosCliente.nome || !dadosCliente.telefone) {
      return NextResponse.json({ error: 'Dados do cliente inválidos.' }, { status: 400 });
    }

    const itensValidos = itens.every((item) =>
      typeof item.item_cardapio_id === 'string' &&
      item.item_cardapio_id.length > 0 &&
      Number.isInteger(item.quantidade) &&
      item.quantidade > 0
    );
    if (!itensValidos) {
      return NextResponse.json({ error: 'Itens do carrinho inválidos.' }, { status: 400 });
    }

    // Inicializa o cliente do servidor assíncrono para Route Handlers
    const supabase = await createClient();

    // 1. Busca o restaurante e valida se ele existe no banco de dados
    const { data: restaurante, error: errRestaurante } = await supabase
      .from('restaurantes')
      .select('id, stripe_account_id')
      .eq('slug', slug)
      .maybeSingle(); // Retorna nulo de forma limpa se não encontrar

    if (errRestaurante || !restaurante) {
      return NextResponse.json({ error: 'Restaurante não encontrado.' }, { status: 404 });
    }

    // 2. Segurança de Preços: Busca os valores reais dos itens direto do banco de dados (Impede injeção de preço falso pelo console do navegador)
    const idsProdutos = itens.map((i) => i.item_cardapio_id);
    const { data: produtosBanco, error: errProdutos } = await supabase
      .from('itens_cardapio')
      .select('id, nome, preco_venda')
      .eq('restaurante_id', restaurante.id)
      .in('id', idsProdutos);

    if (errProdutos || !produtosBanco || produtosBanco.length !== idsProdutos.length) {
      return NextResponse.json({ error: 'Carrinho vazio ou inválido.' }, { status: 400 });
    }

    const produtos = produtosBanco as ItemCardapioPrecificado[];

    // 3. Monta a árvore de produtos no formato exigido pela Stripe (Line Items)
    const lineItems = itens.map((itemCliente) => {
      const prodBanco = produtos.find((p) => p.id === itemCliente.item_cardapio_id);
      if (!prodBanco) throw new Error('Produto adulterado na requisição.');

      return {
        price_data: {
          currency: 'brl',
          product_data: {
            name: prodBanco.nome,
          },
          unit_amount: Math.round(Number(prodBanco.preco_venda) * 100), // Valores em centavos convertidos de forma precisa
        },
        quantity: itemCliente.quantidade,
      };
    });

    // 4. Configuração da Sessão de Checkout
    const sessaoParams: Stripe.Checkout.SessionCreateParams = {
      line_items: lineItems,
      mode: 'payment',
      success_url: `${appUrl}/${slug}?success=true`,
      cancel_url: `${appUrl}/${slug}?canceled=true`,
      metadata: {
        slug,
        dadosCliente: JSON.stringify(dadosCliente),
        itens: JSON.stringify(itens),
      },
    };

    // Estrutura Connect comentada pronta para o MVP caso decida ativar o split futuramente
    // if (restaurante.stripe_account_id) {
    //   sessaoParams.payment_intent_data = {
    //     application_fee_amount: 500,
    //     transfer_data: {
    //       destination: restaurante.stripe_account_id,
    //     },
    //   };
    // }

    const session = await stripe.checkout.sessions.create(sessaoParams);

    return NextResponse.json({ url: session.url });

  } catch (error: unknown) {
    console.error('Erro crítico na rota de checkout Stripe:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
