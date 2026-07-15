# WCS Gestor Inteligente

Aplicação de gestão e vendas para restaurantes, construída com Next.js, React e Supabase.

## Requisitos

- Node.js 20+
- npm 10+

## Variáveis de ambiente

Configure as variáveis abaixo no `.env.local`:

```bash
NEXT_PUBLIC_APP_NAME="WCS Gestor Inteligente"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
```

## Desenvolvimento local

```bash
npm install
npm run dev
```

## Qualidade e validação

```bash
npm run lint
npm run build
```

Esses dois comandos devem estar verdes antes de publicar em produção.

## Decisões técnicas importantes

- Branding centralizado em `utils/branding.ts` com fallback para `WCS Gestor Inteligente`.
- Proteção de rotas no ponto de entrada `proxy.ts` (convenção do Next.js 16), reutilizando `updateSession` em `utils/supabase/middleware.ts`.
- Fluxos críticos (checkout/webhook) com validação server-side e sem confiança em totais enviados pelo cliente.

## Stack principal

- Next.js 16
- React 19
- TypeScript
- Supabase
- Stripe
