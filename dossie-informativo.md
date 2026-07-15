## 📑 Relatório Descritivo do Sistema: WCS Gestor Inteligente (antes chamado AceleraFood Tech)

## 1. Modelo de Negócios e Proposta de Valor
O sistema é uma plataforma SaaS B2B focada em e-commerce de alta conversão para delivery (hambúrgueres, açaí, etc.) acoplada a um Centro de Inteligência Financeira e Operacional. A plataforma é mobile-first. A plataforma é destinada ao público brasileiro.

## Diferenciais Competitivos

* Decisão de Escoamento de Tráfego: Cruzamento automatizado do CPA (Custo por Aquisição via Meta Ads) com o CMV (Custo de Mercadoria Vendida) dinâmico extraído da ficha técnica.
* Análise de Funil Atômica: Monitoramento do comportamento do usuário desde o clique no anúncio até a confirmação de pagamento na API de gateway.
* Recomendações Práticas: Indicação de quais campanhas pausar ou acelerar com base na lucratividade real diária.

------------------------------
## 2. Tecnologias e Arquitetura Stack

* Framework Principal: Next.js (App Router) utilizando React Server Components (RSC) para renderização eficiente.
* Linguagem: TypeScript para tipagem estática e segurança do código.
* Estilização: Tailwind CSS com arquitetura de tokens modernos.
* Banco de Dados & Backend-as-a-Service: Supabase para autenticação (Supa Auth), persistência de dados SQL e sincronização reativa em tempo real.
* Processamento de Pagamentos: Stripe e Mercado Pago.
* APIs de Terceiros: Integração via proxy com a API Nominatim (OpenStreetMap) para geolocalização reversa no checkout.

------------------------------
## 3. Estrutura Atual de Diretórios
A arquitetura segue o padrão do Next.js App Router estruturado em módulos claros de responsabilidade (repomix-ou... pp. 1-2):

├── actions/                         # Funções nativas 'use server' (Server Actions)
│   ├── admin.ts                     # Regras gerais de administração de produtos
│   ├── adminInsumos.ts              # CRUD de insumos e matéria-prima
│   ├── adminMetricas.ts             # Processamento e cálculos do funil de vendas
│   ├── auth.ts                      # Fluxo de login e logout no Supabase
│   ├── cardapio.ts                  # Manipulação de itens expostos
│   └── checkout.ts                  # Lógica de fechamento de ordens
├── app/                             # Roteamento baseado em arquivos (App Router)
│   ├── (dashboard)/admin/           # Grupo de rotas protegidas por autenticação
│   │   ├── cozinha/page.tsx         # Painel de esteira de pedidos da cozinha
│   │   ├── insumos/page.tsx         # Dashboard de controle de inventário
│   │   └── metricas/page.tsx        # Central de inteligência de tráfego e CMV
│   ├── api/                         # Endpoints HTTP isolados (Route Handlers)
│   │   ├── checkout/route.ts        # Integração e webhook de pagamento
│   │   └── geocode/route.ts         # Proxy de busca de endereço por latitude/longitude
│   ├── login/                       # Tela de autenticação neomórfica do gestor
│   ├── logout/                      # Ação de encerramento de sessão
│   └── [slug]/                      # Rota dinâmica do catálogo e-commerce do cliente
│       └── checkout/page.tsx        # Tela de sacola e formulário iOS-style
├── components/                      # Componentes reutilizáveis de interface (UI)
│   ├── cardapio-admin/              # Formulários, abas e cards do catálogo admin
│   ├── cozinha/                     # Componentes da esteira operativa da cozinha
│   ├── ecommerce/                   # Sacola, contexto de carrinho, abas de CEP e GPS
│   ├── insumos-admin/               # Modais de inserção e edição de custos de insumos
│   └── metricas/                    # Gráficos de funil bento e cards de performance
├── public/                          # Ativos estáticos e vetores de branding (SVGs)
└── utils/supabase/                  # Inicializadores de clientes (Server, Client, Middleware)

------------------------------
## 4. Estrutura Atômica do Banco de Dados
O banco é composto por tabelas normalizadas com forte consistência referencial baseada em chaves do tipo uuid:

* restaurantes: Tabela central do ecossistema (guarda configurações de Meta Pixel, chaves do gateway de pagamento e slugs comerciais).
* itens_cardapio: Produtos finais ofertados aos clientes (contém preço de venda, nome e status de disponibilidade).
* insumos: Inventário de matérias-primas físicas com custos unitários fracionados de compra e alertas de estoque mínimo.
* composicao_produto: Ficha técnica atômica. Realiza o vínculo de N insumos para cada 1 item_cardapio com a quantidade exata utilizada (permitindo o cálculo em tempo real do CMV).
* complementos_produto: Adicionais customizáveis que adicionam valor opcional no momento da compra do produto final.
* pedidos & itens_pedido: Armazenamento detalhado de transações concluídas, dados dos clientes (jsonb), formas de pagamento e parâmetros de rastreamento de anúncios (fb_click_id, fb_browser_id).
* metricas_funil: Histórico quantitativo diário de visualizações do cardápio, checkouts iniciados, compras concluídas e custos de anúncios injetados via Meta Ads.

------------------------------
## 5. Fluxo Operacional Esperado
## Jornada do Cliente Final (Máquina de Vendas)

   1. Entrada: O cliente clica em um anúncio direcionado e acessa a rota dinâmica /[slug]. Os metadados do clique do Facebook são capturados.
   2. Montagem da Sacola: Utiliza o component ContextoCarrinho para adicionar itens e complementos de forma assíncrona.
   3. Checkout em Duas Etapas:
   * Etapa 1 (Sacola): Revisão visual dos itens e valores.
      * Etapa 2 (Entrega): Escolha flexível por digitação de CEP, captura por GPS em tempo real via geolocalização reversa, ou Retirada com link para rota no Google Maps.
   4. Processamento: Os dados do formulário e o subtotal líquido geram a transação no gateway seguro.

## Jornada Operativa da Cozinha

   1. O pedido pago dispara uma atualização reativa no painel administrativo /admin/cozinha via Supabase.
   2. A cozinha atualiza o status do pedido em tempo real pela esteira interna.
   3. O insumo correspondente configurado na ficha técnica recebe baixa automática e proporcional no estoque (estoque_atual).

## Jornada Estratégica do Gestor

   1. Acessa o painel /admin/metricas.
   2. Analisa a saúde financeira através de três indicadores visuais do padrão Bento Grid:
   * Faturamento Líquido Real via transações confirmadas.
      * CMV Acumulado deduzido do estoque com base nas fichas técnicas.
      * Margem de Contribuição Bruta correlacionada com a perda por abandono de carrinho e investimentos nas plataformas de tráfego pago.
   
------------------------------
## 6. Diretrizes Relevantes

* Design de Interface do Painel do Gestor: segue um padrão minimalista estilo iOS/Bento Grid, priorizando tons monocromáticos (zinco/cinza) com destaques em Coral/Laranja (#E16349) para botões de ação principal.
* Segurança de Rotas: O arquivo `proxy.ts` aplica o filtro global de requisições e delega a validação de sessão para `utils/supabase/middleware.ts`. Caso o token de sessão não seja validado no servidor, o usuário deve ser redirecionado imediatamente para `/login`.
