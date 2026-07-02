# Diretrizes do Sistema - Plataforma de Vendas e Inteligência Multi-Delivery

## 1. Escopo Atualizado (MVP)
Este sistema é composto por duas frentes unificadas:
1. Um E-commerce de Delivery Proprietário: Catálogo, Checkout (Pix/Cartão) e Rastreio de Pedidos em Tempo Real.
2. Um Painel de Diagnóstico Financeiro: Cruzamento de métricas do funil de vendas (Acessos, Abandonos, Conversões) com dados de custo (CMV + CPA do Meta Ads).

## 2. Stack Tecnológica
- Frontend: Next.js (App Router) + Tailwind CSS + Shadcn/ui
- Banco de Dados & Tempo Real: Supabase (PostgreSQL + Realtime)
- Backend: Next.js Serverless API Routes (`/app/api`)
- Rastreamento: Integração com Pixel do Meta Ads e API de Conversões.

## 3. Estrutura do Banco de Dados Relacional (Multi-Nicho)
O banco de dados deve ser agnóstico a produtos. As tabelas fundamentais são:
- `insumos`: Itens brutos e custos (ex: morango, blend, queijo).
- `itens_cardapio`: O produto final exposto com preço de venda.
- `composicao_produto`: A ficha técnica ligando insumos aos itens do cardápio.
- `pedidos`: Status, dados do cliente, valor total e itens comprados.
- `metricas_funil`: Cliques, visitas, checkouts iniciados e abandonos.

## 4. Regras de Desenvolvimento com IA (Foco em Custo)
- Sempre que possível utilize a melhor abordagem que irá economizar tokens e gerar uma aplicação funcional, de qualidade e de fácil manutenção.
- Sempre utilize boas práticas de desenvolvimento.
- Ao escrever o código, seja técnico onde precisa ser técnico, mas seja simples onde você possa ser simples.
- Trabalhe estritamente por módulos isolados. Nunca altere o front-end e o banco ao mesmo tempo.
- Utilize TypeScript estrito. Forneça apenas blocos de código modificados (Diffs), nunca o arquivo inteiro preenchido com comentários.
