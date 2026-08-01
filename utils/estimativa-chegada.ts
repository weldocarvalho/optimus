// utils/estimativa-chegada.ts
// Cálculo puro (sem I/O) da estimativa de chegada do pedido. Seguro para
// importar tanto em código de servidor quanto em componentes 'use client'.

export interface ConfiguracaoTempoPreparo {
  baseMinutos: number;
  incrementoPorPedidoMinutos: number;
  tetoMinutos: number;
}

/**
 * Tempo de preparo estimado no momento da criação do pedido, com base em
 * quantos pedidos ativos já estão na fila da cozinha. Respeita um teto
 * máximo configurável por loja, para não gerar estimativas absurdas em
 * picos de demanda.
 */
export function calcularTempoPreparoEstimado(
  config: ConfiguracaoTempoPreparo,
  pedidosNaFila: number
): number {
  const bruto = config.baseMinutos + config.incrementoPorPedidoMinutos * Math.max(0, pedidosNaFila);
  return Math.min(Math.max(0, bruto), config.tetoMinutos);
}

function calcularMinutosDecorridos(dataReferenciaIso: string): number {
  const referencia = new Date(dataReferenciaIso).getTime();
  if (Number.isNaN(referencia)) {
    return 0;
  }
  return (Date.now() - referencia) / 60000;
}

/**
 * Ponto de partida de uma contagem regressiva: pega o total estimado e
 * desconta o que já passou desde a referência (ex: criação do pedido, ou
 * o momento do despacho). Usado só UMA VEZ, no instante em que o valor
 * aparece na tela — a partir daí, a contagem decresce sozinha no cliente
 * (um cronômetro simples), sem precisar recalcular contra o relógio a
 * cada tick.
 */
export function calcularMinutosRestantes(totalMinutos: number, referenciaIso: string): number {
  const decorridos = calcularMinutosDecorridos(referenciaIso);
  return Math.max(0, Math.round(totalMinutos - decorridos));
}
