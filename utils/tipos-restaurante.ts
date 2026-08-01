// utils/tipos-restaurante.ts

/**
 * Lista fechada dos segmentos de negócio suportados pela plataforma.
 * O valor salvo em `restaurantes.tipo` deve ser sempre um destes códigos.
 * Usado tanto pelo admin (cadastro/edição da loja) quanto pelo seletor de
 * template visual do cardápio público (app/[slug]/page.tsx).
 */
export const TIPOS_RESTAURANTE = [
  'ACAITERIA',
  'HAMBURGUERIA',
  'PIZZARIA',
  'RESTAURANTE_TRADICIONAL',
  'CAFETERIA_DOCERIA',
  'SORVETERIA',
  'SUSHI_BAR',
  'FITNESS_SAUDAVEL',
  'PASTELARIA',
  'ESPETARIA',
] as const;

export type TipoRestaurante = (typeof TIPOS_RESTAURANTE)[number];

/**
 * Rótulo em pt-BR de cada tipo, para exibição em telas de admin.
 */
export const ROTULO_TIPO_RESTAURANTE: Record<TipoRestaurante, string> = {
  ACAITERIA: 'Açaiteria',
  HAMBURGUERIA: 'Hamburgueria',
  PIZZARIA: 'Pizzaria',
  RESTAURANTE_TRADICIONAL: 'Restaurante tradicional',
  CAFETERIA_DOCERIA: 'Cafeteria/doceria',
  SORVETERIA: 'Sorveteria',
  SUSHI_BAR: 'Sushi bar',
  FITNESS_SAUDAVEL: 'Comida fitness/saudável',
  PASTELARIA: 'Pastelaria',
  ESPETARIA: 'Espetaria',
};

/**
 * Tipo usado como fallback sempre que `restaurantes.tipo` estiver vazio,
 * não reconhecido, ou apontar para um segmento que ainda não tem um
 * template visual próprio construído. Hamburgueria é o template genérico
 * histórico da plataforma — seguro para qualquer loja.
 */
export const TIPO_RESTAURANTE_PADRAO: TipoRestaurante = 'HAMBURGUERIA';

export function normalizarTipoRestaurante(tipo: string | null | undefined): TipoRestaurante {
  const tipoNormalizado = (tipo ?? '').trim().toUpperCase();
  const encontrado = TIPOS_RESTAURANTE.find((candidato) => candidato === tipoNormalizado);
  return encontrado ?? TIPO_RESTAURANTE_PADRAO;
}
