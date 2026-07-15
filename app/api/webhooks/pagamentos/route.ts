// app/api/webhooks/pagamentos/route.ts
import { NextResponse } from 'next/server';
import { createWebhookAdminClient } from '@/utils/supabase/webhook';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

interface ItemMetadado {
  item_cardapio_id: string;
  quantidade: number;
}

interface ItemCardapioPrecificado {
  id: string;
  preco_venda: number;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Erro interno desconhecido.';
}

export async function POST(request: Request) {
  if (!stripe || !endpointSecret) {
    return NextResponse.json({ error: 'Webhook de pagamento não configurado.' }, { status: 500 });
  }

  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) {
      return NextResponse.json({ error: 'Assinatura ou Secret faltando.' }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    console.error(`❌ Falha na validação do Webhook Stripe: ${message}`);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // INTERCEPTA O EVENTO DE SUCESSO DE PAGAMENTO
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true });
    }
    
    const slug = session.metadata?.slug;
    const valorTotal = session.amount_total ? session.amount_total / 100 : 0;

    if (!slug) {
      console.error('❌ Webhook falhou: Slug do restaurante ausente nos metadados.');
      return NextResponse.json({ error: 'Metadados incompletos.' }, { status: 400 });
    }

    try {
      if (!session.metadata?.dadosCliente || !session.metadata?.itens) {
        throw new Error('Metadados obrigatórios ausentes no checkout.');
      }
      const dadosCliente = JSON.parse(session.metadata.dadosCliente);
      const itens = JSON.parse(session.metadata.itens) as ItemMetadado[];
      const clienteValido = dadosCliente && typeof dadosCliente.nome === 'string' && typeof dadosCliente.telefone === 'string';
      if (!clienteValido) {
        throw new Error('Dados do cliente inválidos no metadado do checkout.');
      }
      if (valorTotal <= 0) {
        throw new Error('Valor total inválido no evento de pagamento.');
      }
      if (!Array.isArray(itens) || itens.length === 0) {
        throw new Error('Itens inválidos no metadado do checkout.');
      }
      const itensValidos = itens.every((item) =>
        typeof item.item_cardapio_id === 'string' &&
        item.item_cardapio_id.length > 0 &&
        Number.isInteger(item.quantidade) &&
        item.quantidade > 0
      );
      if (!itensValidos) {
        throw new Error('Estrutura de itens inválida no metadado do checkout.');
      }

      // Inicializa o cliente com privilégios Service Role para ignorar RLS
      const supabase = createWebhookAdminClient();

      // 1. Descobre o ID do restaurante pelo slug indexado de forma resiliente
      const { data: restaurante, error: errRestaurante } = await supabase
        .from('restaurantes')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (errRestaurante || !restaurante) {
        throw new Error(`Restaurante não identificado para o slug: ${slug}`);
      }

      if (itens.length === 0) {
        throw new Error('Nenhum item válido decodificado dos metadados.');
      }

      // 2. Segurança de Preços: Busca o preço vigente de tabela de todos os produtos do lote
      const idsProdutos = itens.map(i => i.item_cardapio_id);
      const { data: produtosBanco, error: errProdutos } = await supabase
        .from('itens_cardapio')
        .select('id, preco_venda')
        .eq('restaurante_id', restaurante.id)
        .in('id', idsProdutos);

      if (errProdutos || !produtosBanco || produtosBanco.length !== idsProdutos.length) {
        throw new Error('Falha ao recuperar preços vigentes dos produtos para conciliação.');
      }
      const produtos = produtosBanco as ItemCardapioPrecificado[];

      // 3. Insere o Pedido definitivo no Supabase com status PAGO (Envia direto para a cozinha)
      const { data: novoPedido, error: errPedido } = await supabase
        .from('pedidos')
        .insert([{
          restaurante_id: restaurante.id,
          status: 'PAGO',
          valor_total: valorTotal,
          forma_pagamento: 'CARTAO',
          dados_cliente: dadosCliente
        }])
        .select()
        .single();

      if (errPedido || !novoPedido) {
        throw errPedido || new Error('Erro ao criar pedido mestre no banco.');
      }

      // 4. Cadastra as linhas de itens vinculadas ao pedido mestre
      const linesItemsInsert = itens.map((item) => {
        const prod = produtos.find((p) => p.id === item.item_cardapio_id);
        return {
          pedido_id: novoPedido.id,
          item_cardapio_id: item.item_cardapio_id,
          quantidade: item.quantidade,
          preco_unitario: prod ? Number(prod.preco_venda) : 0
        };
      });

      const { error: errItens } = await supabase
        .from('itens_pedido')
        .insert(linesItemsInsert);

      if (errItens) throw errItens;

      // 5. BAIXA OPERACIONAL ATÔMICA: Traz todas as receitas em lote (Fim do N+1 em loops)
      const { data: composicoes, error: errCompo } = await supabase
        .from('composicao_produto')
        .select('item_cardapio_id, insumo_id, quantidade_necessaria')
        .in('item_cardapio_id', idsProdutos);

      if (errCompo) {
        throw new Error(`Falha ao carregar composição dos produtos: ${errCompo.message}`);
      }

      if (composicoes) {
        const quantidadePorItem = new Map(itens.map(i => [i.item_cardapio_id, i.quantidade]));

        for (const comp of composicoes) {
          const qtdVendidaDoProduto = quantidadePorItem.get(comp.item_cardapio_id) || 0;
          const quantidadeTotalDeduzir = Number(comp.quantidade_necessaria) * qtdVendidaDoProduto;
          
          if (quantidadeTotalDeduzir > 0) {
            // Executa a dedução atômica direta via Procedure RPC armazenada no Postgres
            const { error: errDeduzir } = await supabase.rpc('deduzir_estoque_insumo', {
              p_insumo_id: comp.insumo_id,
              p_quantidade: quantidadeTotalDeduzir
            });
            if (errDeduzir) {
              throw new Error(`Falha ao deduzir estoque: ${errDeduzir.message}`);
            }
          }
        }
      }

      // 6. MOTOR DE GROWTH SEGURO (FIM DA RACE CONDITION): Incremento atômico nativo via RPC
      const hoje = new Date().toISOString().split('T')[0];
      const { error: errFunil } = await supabase.rpc('incrementar_compras_funil', {
        p_restaurante_id: restaurante.id,
        p_data: hoje
      });
      if (errFunil) {
        throw new Error(`Falha ao atualizar métricas de funil: ${errFunil.message}`);
      }

      console.log(`✅ Pedido ${novoPedido.id} processado e conciliado com absoluto sucesso via Webhook Stripe!`);

    } catch (dbError: unknown) {
      const message = getErrorMessage(dbError);
      console.error('❌ Erro de processamento interno no banco do Webhook:', dbError);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Responde com status 200 confirmando o recebimento idôneo à Stripe
  return NextResponse.json({ received: true });
}
