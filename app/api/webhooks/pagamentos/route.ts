// app/api/webhooks/pagamentos/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

interface ItemMetadado {
  item_cardapio_id: string;
  quantidade: number;
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) {
      return NextResponse.json({ error: 'Assinatura ou Secret faltando.' }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`❌ Falha na validação do Webhook: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // INTERCEPTA O EVENTO DE SUCESSO DE PAGAMENTO
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const slug = session.metadata?.slug;
    const valorTotal = session.amount_total ? session.amount_total / 100 : 0;

    // Recuperação segura e blindada contra falhas de estouro de string do JSON do cliente
    let dadosCliente = null;
    try {
      if (session.metadata?.dadosCliente) {
        dadosCliente = JSON.parse(session.metadata.dadosCliente);
      }
    } catch {
      dadosCliente = { nome: 'Cliente Checkout Stripe', telefone: session.customer_details?.phone || '' };
    }

    // Recuperação segura do array de itens do carrinho
    let itens: ItemMetadado[] = [];
    try {
      if (session.metadata?.itens) {
        itens = JSON.parse(session.metadata.itens);
      }
    } catch {
      itens = [];
    }

    if (!slug) {
      console.error('❌ Webhook falhou: Slug do restaurante ausente nos metadados.');
      return NextResponse.json({ received: true });
    }

    try {
      // 1. Descobre o ID do restaurante pelo slug indexado
      const { data: restaurante } = await supabase
        .from('restaurantes')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!restaurante) throw new Error(`Restaurante não identificado para o slug: ${slug}`);

      if (itens.length === 0) throw new Error('Nenhum item válido decodificado dos metadados.');

      // 2. Segurança de Preços: Busca o preço de tabela do item para evitar adulterações
      const idsProdutos = itens.map(i => i.item_cardapio_id);
      const { data: produtosBanco } = await supabase
        .from('itens_cardapio')
        .select('id, preco_venda')
        .in('id', idsProdutos);

      if (!produtosBanco || produtosBanco.length === 0) {
        throw new Error('Falha ao recuperar preços vigentes dos produtos para conciliação.');
      }

      // 3. Insere o Pedido definitivo no Supabase como PAGO
      const { data: novoPedido, error: errPedido } = await supabase
        .from('pedidos')
        .insert([{
          restaurante_id: restaurante.id,
          status: 'PAGO', // Já entra aprovado diretamente para a cozinha
          valor_total: valorTotal,
          forma_pagamento: 'CARTAO',
          dados_cliente: dadosCliente
        }])
        .select()
        .single();

      if (errPedido || !novoPedido) throw errPedido || new Error('Erro ao criar pedido mestre.');

      // 4. Cadastra as linhas de itens vinculadas ao pedido mestre
      const linhasItens = itens.map((item) => {
        const prod = produtosBanco.find(p => p.id === item.item_cardapio_id);
        return {
          pedido_id: novoPedido.id,
          item_cardapio_id: item.item_cardapio_id,
          quantidade: item.quantidade,
          preco_unitario: prod ? Number(prod.preco_venda) : 0
        };
      });

      const { error: errItens } = await supabase.from('itens_pedido').insert(linhasItens);
      if (errItens) throw errItens;

      // 5. BAIXA OPERACIONAL ATÔMICA: Roda a RPC para cada insumo da receita
      for (const item of itens) {
        const { data: composicoes } = await supabase
          .from('composicao_produto')
          .select('insumo_id, quantidade_necessaria')
          .eq('item_cardapio_id', item.item_cardapio_id);

        if (composicoes) {
          for (const comp of composicoes) {
            const quantidadeTotalDeduzir = Number(comp.quantidade_necessaria) * item.quantidade;
            
            await supabase.rpc('deduzir_estoque_insumo', {
              p_insumo_id: comp.insumo_id,
              p_quantidade: quantidadeTotalDeduzir
            });
          }
        }
      }

      // 6. MOTOR DE GROWTH (CORRIGIDO): Incrementa a métrica de vendas de forma purista no Postgres
      // Buscamos o registro de métricas do dia para fazer o incremento nativo somando +1
      const hoje = new Date().toISOString().split('T')[0];
      
      // Captura o valor atual das métricas do dia de hoje para o restaurante
      const { data: metricaAtual } = await supabase
        .from('metricas_funil')
        .select('compras_concluidas')
        .eq('restaurante_id', restaurante.id)
        .eq('data', hoje)
        .single();

      const totalConcluidoAtual = metricaAtual?.compras_concluidas ? Number(metricaAtual.compras_concluidas) : 0;

      // Atualiza somando +1 de forma limpa e compatível com o Supabase Client
      await supabase
        .from('metricas_funil')
        .update({ compras_concluidas: totalConcluidoAtual + 1 })
        .eq('restaurante_id', restaurante.id)
        .eq('data', hoje);

      console.log(`✅ Pedido ${novoPedido.id} processado com sucesso via Webhook Stripe!`);

    } catch (dbError: any) {
      console.error('❌ Erro interno de processamento no banco do Webhook:', dbError);
      return NextResponse.json({ error: dbError.message || 'Database processing failed' }, { status: 500 });
    }
  }

  // Informa à Stripe que o aviso foi recebido e processado sem falhas de rede
  return NextResponse.json({ received: true });
}
