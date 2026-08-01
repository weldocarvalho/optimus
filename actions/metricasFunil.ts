// actions/metricasFunil.ts
'use server'

import { createClient } from '@/utils/supabase/server'

/**
 * Registra "checkout iniciado" no funil de métricas do restaurante,
 * disparado pela mesma transição (SACOLA -> ENTREGA) que já aciona o
 * evento InitiateCheckout do Pixel do Meta. Melhor esforço: uma falha aqui
 * nunca pode interromper o checkout do cliente.
 */
export async function registrarCheckoutIniciadoFunil(slug: string) {
  try {
    const supabase = await createClient()
    const slugNormalizado = slug.trim()
    if (!slugNormalizado) return

    const { data: restaurante, error: erroRestaurante } = await supabase
      .from('restaurantes')
      .select('id')
      .eq('slug', slugNormalizado)
      .maybeSingle()

    if (erroRestaurante || !restaurante) {
      console.error('Falha ao localizar restaurante para registrar checkout no funil:', erroRestaurante)
      return
    }

    const hoje = new Date().toISOString().split('T')[0]
    const { error: erroFunil } = await supabase.rpc('incrementar_checkout_funil', {
      p_restaurante_id: restaurante.id,
      p_data: hoje,
    })

    if (erroFunil) {
      console.error('Falha ao registrar checkout iniciado no funil de métricas:', erroFunil)
    }
  } catch (error) {
    console.error('Erro inesperado ao registrar checkout iniciado no funil:', error)
  }
}
