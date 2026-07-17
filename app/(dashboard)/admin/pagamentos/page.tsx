import { AdminNavHeader } from '@/components/admin/AdminNavHeader';
import {
  obterIntegracaoMercadoPagoPorRestauranteId,
  obterRestauranteIdDoGestorLogado,
} from '@/utils/mercado-pago';
import { createWebhookAdminClient } from '@/utils/supabase/webhook';

export const revalidate = 0;

export default async function PainelPagamentosAdmin() {
  const restauranteId = await obterRestauranteIdDoGestorLogado();
  const supabase = createWebhookAdminClient();
  const { data: restaurante } = await supabase
    .from('restaurantes')
    .select('nome, slug')
    .eq('id', restauranteId)
    .maybeSingle();

  const integracao = await obterIntegracaoMercadoPagoPorRestauranteId(restauranteId);

  return (
    <div className="min-h-screen bg-[#F3F3F3] text-[#1A1A1A] font-sans antialiased flex items-start justify-center p-4 sm:p-8 md:py-12">
      <div className="w-full max-w-4xl space-y-6">
        <AdminNavHeader activeTab="pagamentos" />

        <section className="bg-white rounded-[24px] p-6 shadow-sm shadow-zinc-300/40 space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Integrações de pagamento</h1>
            <p className="text-sm text-zinc-500">
              Conecte a conta do Mercado Pago do estabelecimento para processar PIX e cartão com o dinheiro caindo na conta do lojista.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">Estabelecimento</div>
            <div className="text-lg font-semibold text-zinc-900">{restaurante?.nome ?? 'Estabelecimento'}</div>
            <div className="text-sm text-zinc-500">/{restaurante?.slug ?? ''}</div>
          </div>

          <div className="rounded-2xl border border-zinc-200 p-5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">Mercado Pago</div>
                <div className="text-lg font-semibold text-zinc-900">
                  {integracao?.connection_status === 'conectado' ? 'Conta conectada' : 'Conta não conectada'}
                </div>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-700">
                {integracao?.connection_status ?? 'pendente'}
              </span>
            </div>

            <div className="text-sm text-zinc-600">
              {integracao?.account_email ? `Conta vinculada: ${integracao.account_email}` : 'Nenhuma conta vinculada ainda.'}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <form action="/api/admin/integracoes/mercado-pago/conectar" method="get">
                <button
                  type="submit"
                  className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white"
                >
                  Conectar Mercado Pago
                </button>
              </form>

              <form action="/api/admin/integracoes/mercado-pago/desconectar" method="post">
                <button
                  type="submit"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold uppercase tracking-wider text-zinc-700"
                >
                  Desconectar
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-5 text-sm text-zinc-500">
            Callback configurado em <span className="font-mono">/api/admin/integracoes/mercado-pago/callback</span>.
          </div>
        </section>
      </div>
    </div>
  );
}
