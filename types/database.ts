// types/database.ts

/**
 * Interface que representa um adicional individual livre selecionado
 * pelo cliente final na interface mobile do e-commerce.
 */
export interface AdicionalSelecionado {
  id: string;
  nome: string;
  preco: number;
}

/**
 * Interface mestre da tabela de restaurantes/estabelecimentos.
 */
export interface Restaurante {
  id: string;
  nome: string;
  tipo: string;
  slug: string;
  meta_pixel_id: string | null;
  stripe_account_id: string | null;
  meta_access_token: string | null;
  meta_ad_account_id: string | null;
  created_at: string;
}

/**
 * Interface mestre da tabela global de insumos físicos (estoque).
 */
export interface Insumo {
  id: string;
  restaurante_id: string;
  nome: string;
  unidade_medida: string;
  custo_unitario: number;
  estoque_atual: number;
  estoque_minimo: number;
  created_at: string;
}

/**
 * Interface mestre da tabela de itens_cardapio pública da loja.
 * Atualizada dinamicamente com suporte a opcionais de venda em array.
 */
export interface ItemCardapio {
  id: string;
  restaurante_id: string;
  nome: string;
  descricao: string;
  preco_venda: number;
  disponivel: boolean;
  imagem_url: string;
  created_at: string;
  complementos_produto?: ComplementoProduto[];
  
  // Propriedade opcional de transporte sênior para carregar as escolhas do cliente até o checkout
  adicionais_selecionados?: AdicionalSelecionado[];
}

/**
 * Interface relacional que compõe a ficha técnica invisível de CMV e estoque.
 */
export interface ComposicaoProduto {
  id: string;
  item_cardapio_id: string;
  insumo_id: string;
  quantidade_necessaria: number;
  created_at: string;
}

/**
 * Interface definitiva para a nova tabela de complementos comerciais livres.
 */
export interface ComplementoProduto {
  id: string;
  item_cardapio_id: string;
  nome: string;
  preco_adicional: number;
  disponivel: boolean;
  created_at: string;
}

export type FormaPagamento = 'PIX' | 'DINHEIRO' | 'CARTAO';
