import { NextResponse } from 'next/server';

/**
 * GET — Verificação do webhook pelo Meta.
 * A Meta envia mode=subscribe + challenge + verify_token.
 * Se o verify_token bater, devolve o challenge e o endpoint fica verificado.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken) {
    return new NextResponse('Webhook não configurado.', { status: 500 });
  }

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Token de verificação inválido.', { status: 403 });
}

/**
 * POST — Recebe eventos da Meta (entrega, leitura, respostas).
 * Por enquanto apenas confirma o recebimento.
 */
export async function POST() {
  return NextResponse.json({ received: true });
}
