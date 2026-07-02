-- 1. TABELA DE RESTAURANTES (Multi-Inquilino)
CREATE TABLE restaurantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'HAMBURGUERIA', 'ACAI', 'PIZZARIA', etc.
    slug VARCHAR(255) UNIQUE NOT NULL, -- url do cardapio: ://meu-delivery.com
    meta_pixel_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE INSUMOS (Matéria-prima / Estoque)
CREATE TABLE insumos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    unidade_medida VARCHAR(10) NOT NULL, -- 'g', 'ml', 'un'
    custo_unitario NUMERIC(10, 4) NOT NULL, -- Custo por g, ml ou un
    estoque_atual NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    estoque_minimo NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE ITENS DO CARDÁPIO (O Produto Final Vendido)
CREATE TABLE itens_cardapio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco_venda NUMERIC(10, 2) NOT NULL,
    disponivel BOOLEAN DEFAULT true NOT NULL,
    imagem_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA DE COMPOSIÇÃO DE PRODUTO (A Ficha Técnica / Conecta Insumo ao Cardápio)
CREATE TABLE composicao_produto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_cardapio_id UUID REFERENCES itens_cardapio(id) ON DELETE CASCADE NOT NULL,
    insumo_id UUID REFERENCES insumos(id) ON DELETE CASCADE NOT NULL,
    quantidade_necessaria NUMERIC(10, 4) NOT NULL, -- Ex: 0.150 para blend, 40.00 para gramas de queijo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA DE PEDIDOS (A Máquina de Vendas)
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDENTE' NOT NULL, -- 'PENDENTE', 'PAGO', 'PREPARANDO', 'SAIU_ENTREGA', 'ENTREGUE', 'CANCELADO'
    valor_total NUMERIC(10, 2) NOT NULL,
    forma_pagamento VARCHAR(50) NOT NULL, -- 'PIX', 'CARTAO'
    dados_cliente JSONB NOT NULL, -- Nome, Telefone, Endereço de entrega
    fb_browser_id VARCHAR(255), -- Rastreamento do Meta Ads (_fbp)
    fb_click_id VARCHAR(255),   -- Rastreamento do Meta Ads (_fbcl)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA DE ITENS DO PEDIDO (Relação de muitos para muitos)
CREATE TABLE itens_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE NOT NULL,
    item_cardapio_id UUID REFERENCES itens_cardapio(id) NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario NUMERIC(10, 2) NOT NULL
);

-- 7. TABELA DE MÉTRICAS DO FUNIL DE VENDAS (Diagnóstico de Tráfego)
CREATE TABLE metricas_funil (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE NOT NULL,
    data DATE DEFAULT CURRENT_DATE NOT NULL,
    visitas_cardapio INT DEFAULT 0 NOT NULL,
    checkouts_iniciados INT DEFAULT 0 NOT NULL,
    compras_concluidas INT DEFAULT 0 NOT NULL,
    investimento_meta NUMERIC(10, 2) DEFAULT 0.00 NOT NULL, -- Inserido manualmente ou via API futura
    UNIQUE(restaurante_id, data)
);

-- HABILITAR REALTIME APENAS PARA A TABELA DE PEDIDOS (Essencial para o rastreio do cliente)
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
