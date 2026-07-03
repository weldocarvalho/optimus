// actions/adminMetricas.ts
'use server';

import { supabase } from '@/lib/supabase';

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

export async function obterMetricasGrowthDoDia(): Promise<ResumoMetricasFunil> {
  const hoje = new Date().toISOString().split('T')[0];

  // 1. Puxa os acessos brutos e conversões do funil mapeados no banco
  const { data: metricasFunil } = await supabase
    .from('metricas_funil')
    .select('visitas_cardapio, checkouts_iniciados, compras_concluidas')
    .eq('data', hoje)
    .single();

  const visitas = metricasFunil?.visitas_cardapio ? Number(metricasFunil.visitas_cardapio) : 0;
  const checkouts = metricasFunil?.checkouts_iniciados ? Number(metricasFunil.checkouts_iniciados) : 0;
  const compras = metricasFunil?.compras_concluidas ? Number(metricasFunil.compras_concluidas) : 0;

  // Calculo de taxas de eficácia do funil
  const taxaConversaoCardapio = visitas > 0 ? (compras / visitas) * 100 : 0;
  const taxaAbandonoCarrinho = checkouts > 0 ? ((checkouts - compras) / checkouts) * 100 : 0;

  // 2. Busca financeira: Puxa todos os pedidos pagos de hoje para conciliação atômica
  const { data: pedidosHoje } = await supabase
    .from('pedidos')
    .select(`
      id, valor_total,
      itens_pedido (
        quantidade,
        item_cardapio_id
      )
    `)
    .eq('status', 'PAGO')
    .gte('created_at', `${hoje}T00:00:00`)
    .lte('created_at', `${hoje}T23:59:59`);

  const faturamentoTotal = pedidosHoje?.reduce((acc, p) => acc + Number(p.valor_total), 0) || 0;

  // 3. Cruzamento Dinâmico de CMV: Descobre o custo exato dos insumos de tudo que foi vendido hoje
  let custoInsumosTotal = 0;

  if (pedidosHoje && pedidosHoje.length > 0) {
    // Agrupa todos os itens vendidos no dia
    for (const pedido of pedidosHoje) {
      const itens = pedido.itens_pedido || [];
      for (const item of itens) {
        // Busca a receita (ficha técnica) do produto vendido
        const { data: composicoes } = await supabase
          .from('composicao_produto')
          .select(`
            quantidade_necessaria,
            insumos ( custo_unitario )
          `)
          .eq('item_cardapio_id', item.item_cardapio_id);

        if (composicoes) {
          for (const comp of composicoes) {
            const custoUnitarioInsumo = (comp.insumos as any)?.custo_unitario ? Number((comp.insumos as any).custo_unitario) : 0;
            const quantidadeNecessaria = Number(comp.quantidade_necessaria);
            
            // Custo da linha = quantidade vendida do produto * quantidade do insumo na receita * custo unitário
            custoInsumosTotal += item.quantidade * quantidadeNecessaria * custoUnitarioInsumo;
          }
        }
      }
    }
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
}
