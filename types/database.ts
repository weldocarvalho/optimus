// types/database.ts

export type RestauranteTipo = 'HAMBURGUERIA' | 'ACAI' | 'PIZZARIA';
export type PedidoStatus = 'PENDENTE' | 'PAGO' | 'PREPARANDO' | 'SAIU_ENTREGA' | 'ENTREGUE' | 'CANCELADO';
export type FormaPagamento = 'PIX' | 'CARTAO';

export interface Restaurante {
  id: string;
  nome: string;
  tipo: RestauranteTipo;
  slug: string;
  meta_pixel_id: string | null;
  created_at: string;
}

export interface Insumo {
  id: string;
  restaurante_id: string;
  nome: string;
  unidade_medida: 'g' | 'ml' | 'un';
  custo_unitario: number;
  estoque_atual: number;
  estoque_minimo: number;
  created_at: string;
}

export interface ItemCardapio {
  id: string;
  restaurante_id: string;
  nome: string;
  descricao: string | null;
  preco_venda: number;
  disponivel: boolean;
  imagem_url: string | null;
  created_at: string;
}

export interface ComposicaoProduto {
  id: string;
  item_cardapio_id: string;
  insumo_id: string;
  quantidade_necessaria: number;
  created_at: string;
}

export interface Pedido {
  id: string;
  restaurante_id: string;
  status: PedidoStatus;
  valor_total: number;
  forma_pagamento: FormaPagamento;
  dados_cliente: {
    nome: string;
    telefone: string;
    endereco: {
      rua: string;
      numero: string;
      bairro: string;
      cidade: string;
      cep: string;
    };
  };
  fb_browser_id: string | null;
  fb_click_id: string | null;
  created_at: string;
}

export interface ItemPedido {
  id: string;
  pedido_id: string;
  item_cardapio_id: string;
  quantidade: number;
  preco_unitario: number;
}

export interface MetricasFunil {
  id: string;
  restaurante_id: string;
  data: string;
  visitas_cardapio: number;
  checkouts_iniciados: number;
  compras_concluidas: number;
  investimento_meta: number;
}
