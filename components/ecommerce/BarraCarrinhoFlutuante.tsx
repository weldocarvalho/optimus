// components/ecommerce/BarraCarrinhoFlutuante.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCarrinho } from './ContextoCarrinho';

interface BarraProps {
  ehAcai?: boolean;
}

export default function BarraCarrinhoFlutuante({ ehAcai = false }: BarraProps) {
  const params = useParams();
  const slug = (params?.slug as string) || '';
  const { totalItens, valorTotal } = useCarrinho();

  if (totalItens === 0) return null;

  const corFundoSacola = ehAcai
    ? 'bg-[#3B0D2C]/95 border-[#7D1A52]/30 shadow-[#3B0D2C]/20'
    : 'bg-white/80 border-zinc-200/60 shadow-zinc-300/40 backdrop-blur-xl';

  const corBotaoQuantidade = ehAcai
    ? 'bg-[#2C0A21] text-purple-200 border border-[#7D1A52]/20'
    : 'bg-zinc-100 text-zinc-800 border border-zinc-200 font-mono font-black';

  const corBotaoAcao = ehAcai
    ? 'bg-[#7D1A52] hover:bg-[#631440] text-white'
    : 'bg-[#E52521] hover:bg-[#c91d1a] text-white shadow-[0_4px_14px_rgba(229,37,33,0.3)]';

  const corTextoSubtotal = ehAcai ? 'text-white' : 'text-zinc-900';
  const corTextoLabel = 'text-zinc-400';

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="fixed bottom-0 inset-x-0 p-4 bg-transparent z-40 animate-in slide-in-from-bottom duration-300 select-none">
      <div className={`max-w-md mx-auto rounded-[24px] p-4 flex items-center justify-between shadow-xl border ${corFundoSacola}`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-sm transition-colors ${corBotaoQuantidade}`}>
            {totalItens}
          </div>
          <div>
            <span className={`text-[9px] block font-bold uppercase tracking-widest ${corTextoLabel}`}>Subtotal</span>
            <span className={`font-black text-sm font-mono tracking-tight ${corTextoSubtotal}`}>
              {formatarMoeda(valorTotal)}
            </span>
          </div>
        </div>

        <Link
          href={`/${slug}/checkout`}
          className={`font-black text-xs px-5 py-3 rounded-[16px] active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-md uppercase tracking-wider ${corBotaoAcao}`}
        >
          Ver Sacola
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
