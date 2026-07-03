// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

// Inicialização do SDK herdando a versão padrão da conta Stripe de forma segura
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface ItemCliente {
  item_cardapio_id: string;
  quantidade: number;
}

interface DadosCliente {
  nome: string;
  telefone: string;
  [key: string]: any;
}

interface RequestBody {
  slug: string;
  itens: ItemCliente[];
  dadosCliente: DadosCliente;
}

export async function POST(request: Request) {
  try {
    const { slug, itens, dadosCliente }: RequestBody = await request.json();

    // 1. Busca o restaurante e valida se ele tem conta Stripe configurada
    const { data: restaurante } = await supabase
      .from('restaurantes')
      .select('id, stripe_account_id')
      .eq('slug', slug)
      .single();

    if (!restaurante) {
      return NextResponse.json({ error: 'Restaurante não encontrado.' }, { status: 404 });
    }

    // 2. Segurança de Preços: Busca os valores reais dos itens direto do banco de dados
    const idsProdutos = itens.map((i) => i.item_cardapio_id);
    const { data: produtosBanco } = await supabase
      .from('itens_cardapio')
      .select('id, nome, preco_venda')
      .in('id', idsProdutos);

    if (!produtosBanco || produtosBanco.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio ou inválido.' }, { status: 400 });
    }

    // 3. Monta a árvore de produtos no formato exigido pela Stripe (Line Items)
    const lineItems = itens.map((itemCliente) => {
      const prodBanco = produtosBanco.find(p => p.id === itemCliente.item_cardapio_id);
      if (!prodBanco) throw new Error('Produto adulterado na requisição.');

      return {
        price_data: {
          currency: 'brl',
          product_data: {
            name: prodBanco.nome,
          },
          unit_amount: Math.round(Number(prodBanco.preco_venda) * 100), // Valores em centavos
        },
        quantity: itemCliente.quantidade,
      };
    });

    // 4. Configuração da Sessão de Checkout
    // NOTA: Omitimos completamente o 'payment_method_types' e não usamos 'automatic_payment_methods'.
    // Isso força o Stripe Checkout a carregar de forma transparente todas as formas de pagamento ativas no seu Dashboard (Pix, Cartão, etc.)
    const sessaoParams: Stripe.Checkout.SessionCreateParams = {
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/${slug}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/${slug}?canceled=true`,
      metadata: {
        slug,
        dadosCliente: JSON.stringify(dadosCliente),
        itens: JSON.stringify(itens),
      },
    };

    // Se o restaurante já tiver a conta bancária Stripe Connect configurada, aplica o split automático
    if (restaurante.stripe_account_id) {
      sessaoParams.payment_intent_data = {
        application_fee_amount: 500, // Sua comissão fixa em centavos (Ex: R$ 5,00 por venda)
        transfer_data: {
          destination: restaurante.stripe_account_id,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessaoParams);

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Erro na rota de checkout Stripe:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
