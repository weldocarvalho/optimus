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

        <header className="flex items-center justify-between px-2 select-none">
          <div className="leading-tight">
            <h1 className="text-xl font-black tracking-tight text-[#1A1A1A]">Monitor de Produção</h1>
            <span className="text-[11px] font-bold text-zinc-400 block mt-0.5">Fila de pedidos ativa em tempo real</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={executarReconciliacaoPedidos}
              disabled={sincronizando}
              className="rounded-[12px] border border-zinc-200/80 bg-white px-3.5 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition-all duration-150 hover:bg-zinc-50 disabled:opacity-50 shadow-sm"
            >
              {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
            </button>
            
            <div className="flex items-center gap-2 bg-white border border-zinc-200/60 px-3 py-2 rounded-[12px] shadow-sm">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Canal Ativo</span>
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
