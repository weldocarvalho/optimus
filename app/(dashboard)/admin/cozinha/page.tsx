// app/(dashboard)/admin/cozinha/page.tsx
'use client';

import React from 'react';
import { useCozinha } from './useCozinha';
import { BarraNavegacaoCozinha } from '@/components/cozinha/BarraNavegacaoCozinha';
import { ColunaEsteiraCozinha } from '@/components/cozinha/ColunaEsteiraCozinha';

export default function PainelCozinhaAdmin() {
  const { 
    pedidos, 
    loading, 
    sincronizando, 
    isPending, 
    executarReconciliacaoPedidos, 
    alterarStatusPedido 
  } = useCozinha();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E16349] border-t-transparent" />
      </div>
    );
  }

  const pedidosNovos = pedidos.filter(p => p.status === 'PENDENTE' || p.status === 'PAGO');
  const pedidosPreparo = pedidos.filter(p => p.status === 'PREPARANDO');
  const pedidosProntos = pedidos.filter(p => p.status === 'PRONTO');

  return (
    <div className="min-h-screen bg-[#F3F3F3] text-[#1A1A1A] font-sans antialiased flex items-start justify-center p-4 sm:p-8 md:py-12">
      <div className="w-full max-w-4xl space-y-6">
        
        <BarraNavegacaoCozinha />

        <header className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between select-none">
          <div className="leading-tight">
            <h1 className="text-xl font-bold tracking-tight text-[#1A1A1A]">Monitor de produção</h1>
            <span className="mt-0.5 block text-[11px] font-semibold text-zinc-500">Fila de pedidos ativa em tempo real</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={executarReconciliacaoPedidos}
              disabled={sincronizando}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
            </button>
            
            <div className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-500">Em tempo real</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <ColunaEsteiraCozinha titulo="Entrada / Pagos" pedidos={pedidosNovos} onAvancarStatus={alterarStatusPedido} isMutating={isPending} />
          <ColunaEsteiraCozinha titulo="Em Preparo" pedidos={pedidosPreparo} onAvancarStatus={alterarStatusPedido} isMutating={isPending} />
          <ColunaEsteiraCozinha titulo="Pronto para Envio" pedidos={pedidosProntos} onAvancarStatus={alterarStatusPedido} isMutating={isPending} />
        </div>

      </div>
    </div>
  );
}
