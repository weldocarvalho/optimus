import assert from 'node:assert/strict'
import { test, before, after } from 'node:test'
import {
  baseUrl,
  carregarEnvLocal,
  esperarServidorPronto,
  iniciarServidor,
  pararServidor,
} from './helpers.mjs'

let servidor

before(async () => {
  carregarEnvLocal()
  servidor = iniciarServidor()
  await esperarServidorPronto(baseUrl)
})

after(async () => {
  await pararServidor(servidor)
})

test('bloco 5: webhook/pagamento com validações defensivas', async () => {
  const webhookConfigurado =
    Boolean(process.env.STRIPE_SECRET_KEY) && Boolean(process.env.STRIPE_WEBHOOK_SECRET)

  const getWebhook = await fetch(`${baseUrl}/api/webhooks/pagamentos`, {
    method: 'GET',
    redirect: 'manual',
  })
  assert.equal(getWebhook.status, 405)

  const postSemAssinatura = await fetch(`${baseUrl}/api/webhooks/pagamentos`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  })

  const bodySemAssinatura = await postSemAssinatura.json()
  if (webhookConfigurado) {
    assert.equal(postSemAssinatura.status, 400)
    assert.equal(
      String(bodySemAssinatura.error || '').includes('Assinatura'),
      true,
      'Webhook configurado deve rejeitar payload sem assinatura'
    )
  } else {
    assert.equal(postSemAssinatura.status, 500)
    assert.equal(
      String(bodySemAssinatura.error || '').includes('não configurado'),
      true,
      'Webhook sem configuração deve retornar erro explícito de configuração'
    )
  }

  const postAssinaturaInvalida = await fetch(`${baseUrl}/api/webhooks/pagamentos`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': 'invalida',
    },
    body: JSON.stringify({ teste: true }),
  })

  const bodyAssinaturaInvalida = await postAssinaturaInvalida.json()
  if (webhookConfigurado) {
    assert.equal(postAssinaturaInvalida.status, 400)
    assert.equal(
      String(bodyAssinaturaInvalida.error || '').includes('Webhook Error'),
      true,
      'Assinatura inválida deve ser rejeitada com erro de webhook'
    )
  } else {
    assert.equal(postAssinaturaInvalida.status, 500)
  }
})
