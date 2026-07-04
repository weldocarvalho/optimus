// components/cozinha/ColunaEsteiraCozinha.tsx
'use client';

import React from 'react';
import { PedidoCozinha } from '@/app/(dashboard)/admin/cozinha/useCozinha';
import { CardPedidoCozinha } from './CardPedidoCozinha';

interface ColunaEsteiraCozinhaProps {
  titulo: string;
  pedidos: PedidoCozinha[];
  onAvancarStatus: (pedidoId: string, novoStatus: PedidoCozinha['status']) => void;
  isMutating: boolean;
}

export function ColunaEsteiraCozinha({ titulo, pedidos, onAvancarStatus, isMutating }: ColunaEsteiraCozinhaProps) {
  return (
    <div className="rounded-[24px] bg-white border border-zinc-200/60 p-4 shadow-sm shadow-zinc-300/20 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 px-1 select-none">
        <span className="text-xs font-black uppercase tracking-wider text-[#1A1A1A]">{titulo}</span>
        <span className="rounded-[8px] bg-[#F3F3F3] border border-zinc-200/40 px-2 py-0.5 text-xs font-mono font-bold text-zinc-600">
          {pedidos.length}
        </span>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto max-h-[65vh] min-h-[120px] p-0.5">
        {pedidos.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Esteira Limpa</span>
          </div>
        ) : (
          pedidos.map((pedido) => (
            <CardPedidoCozinha
              key={pedido.id}
              pedido={pedido}
              onAvancarStatus={onAvancarStatus}
              isMutating={isMutating}
            />
          ))
        )}
      </div>
    </div>
  );
}
