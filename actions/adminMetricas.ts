// actions/adminMetricas.ts
'use server';

import { createClient } from '@/utils/supabase/server';

export interface ResumoMetricasFunil {
  visitas: number;
  checkouts: number;
  compras: number;
  taxaConversaoCardapio: number;
  taxaAbandonoCarrinho: number;
  faturamentoTotal: number;
  custoInsumosTotal: number;
  lucroOperacionalBruto: number;
}

/**
 * Função auxiliar interna para capturar o restaurante_id do gestor autenticado
 * usando a tabela de amarração baseada na sessão atual do cookie.
 */
async function obterRestauranteIdLogado(): Promise<string> {
  const supabase = await createClient();
  
  const { data: { user }, error: errUser } = await supabase.auth.getUser();
  if (errUser || !user) {
    throw new Error('Usuário não autenticado no Centro de Comando.');
  }

  const { data: perfil, error: errPerfil } = await supabase
    .from('perfis_admin')
    .select('restaurante_id')
    .eq('id', user.id)
    .single();

  if (errPerfil || !perfil) {
    throw new Error('Perfil administrativo ou restaurante não localizado.');
  }

  return perfil.restaurante_id;
}

export async function obterMetricasGrowthDoDia(): Promise<ResumoMetricasFunil> {
  try {
    const supabase = await createClient();
    const restauranteId = await obterRestauranteIdLogado();
    const hoje = new Date().toISOString().split('T')[0];

    // 1. Puxa os acessos brutos e conversões do funil filtrando pelo restaurante logado
    const { data: metricasFunil } = await supabase
      .from('metricas_funil')
      .select('visitas_cardapio, checkouts_iniciados, compras_concluidas')
      .eq('restaurante_id', restauranteId)
      .eq('data', hoje)
      .maybeSingle(); // Usamos maybeSingle para não quebrar o código se o dia acabou de começar e não há métricas ainda

    const visitas = metricasFunil?.visitas_cardapio ? Number(metricasFunil.visitas_cardapio) : 0;
    const checkouts = metricasFunil?.checkouts_iniciados ? Number(metricasFunil.checkouts_iniciados) : 0;
    const compras = metricasFunil?.compras_concluidas ? Number(metricasFunil.compras_concluidas) : 0;

    const taxaConversaoCardapio = visitas > 0 ? (compras / visitas) * 100 : 0;
    const taxaAbandonoCarrinho = checkouts > 0 ? ((checkouts - compras) / checkouts) * 100 : 0;

    // 2. Busca financeira otimizada: Traz os pedidos e já puxa toda a estrutura de custos (CMV) em uma única consulta estruturada
    const { data: pedidosHoje, error: errPedidos } = await supabase
      .from('pedidos')
      .select(`
        id, 
        valor_total,
        itens_pedido (
          quantidade,
          item_cardapio_id,
          itens_cardapio (
            composicao_produto (
              quantidade_necessaria,
              insumos ( custo_unitario )
            )
          )
        )
      `)
      .eq('restaurante_id', restauranteId)
      .eq('status', 'PAGO')
      .gte('created_at', `${hoje}T00:00:00.000Z`)
      .lte('created_at', `${hoje}T23:59:59.999Z`);

    if (errPedidos) {
      console.error('Erro ao buscar pedidos do dia:', errPedidos);
    }

    const faturamentoTotal = pedidosHoje?.reduce((acc, p) => acc + Number(p.valor_total), 0) || 0;
    let custoInsumosTotal = 0;

    // 3. Processamento em memória ultra veloz (Elimina os selects repetitivos do banco)
    if (pedidosHoje && pedidosHoje.length > 0) {
      pedidosHoje.forEach((pedido) => {
        const itens = pedido.itens_pedido || [];
        itens.forEach((item: any) => {
          const quantidadeVendida = Number(item.quantidade);
          const composicoes = item.itens_cardapio?.composicao_produto || [];
          
          composicoes.forEach((comp: any) => {
            const quantidadeNecessaria = Number(comp.quantidade_necessaria);
            const custoUnitarioInsumo = Number(comp.insumos?.custo_unitario || 0);
            
            // Incrementa o custo real atômico
            custoInsumosTotal += quantidadeVendida * quantidadeNecessaria * custoUnitarioInsumo;
          });
        });
      });
    }

    const lucroOperacionalBruto = faturamentoTotal - custoInsumosTotal;

    return {
      visitas,
      checkouts,
      compras,
      taxaConversaoCardapio: Math.round(taxaConversaoCardapio * 10) / 10,
      taxaAbandonoCarrinho: Math.round(Math.max(0, taxaAbandonoCarrinho) * 10) / 10,
      faturamentoTotal: Math.round(faturamentoTotal * 100) / 100,
      custoInsumosTotal: Math.round(custoInsumosTotal * 100) / 100,
      lucroOperacionalBruto: Math.round(lucroOperacionalBruto * 100) / 100,
    };
  } catch (error) {
    console.error('Erro na action obterMetricasGrowthDoDia:', error);
    return {
      visitas: 0,
      checkouts: 0,
      compras: 0,
      taxaConversaoCardapio: 0,
      taxaAbandonoCarrinho: 0,
      faturamentoTotal: 0,
      custoInsumosTotal: 0,
      lucroOperacionalBruto: 0,
    };
  }
}
