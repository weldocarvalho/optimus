// components/metricas/CardsPerformanceGrowth.tsx
'use client';

import React from 'react';
import { ResumoMetricasFunil } from '@/actions/adminMetricas';

interface CardsPerformanceGrowthProps {
  dados: ResumoMetricasFunil;
}

export function CardsPerformanceGrowth({ dados }: CardsPerformanceGrowthProps) {
  // Cálculo do percentual real de CMV sobre o faturamento do dia
  const percentualCmvDiario = dados.faturamentoTotal > 0 
    ? Math.round((dados.custoInsumosTotal / dados.faturamentoTotal) * 100) 
    : 0;

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      
      {/* CARD 1: FATURAMENTO BRUTO */}
      <div className="bg-white rounded-[24px] p-6 border border-zinc-200/60 shadow-sm shadow-zinc-300/20 select-none">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 block mb-1">
          Faturamento Líquido (Stripe)
        </span>
        <h3 className="text-2xl font-extrabold tracking-tight text-[#1A1A1A] font-mono">
          {formatarMoeda(dados.faturamentoTotal)}
        </h3>
        <span className="text-[11px] font-semibold text-zinc-400 block mt-2">
          Dinheiro real processado hoje
        </span>
      </div>

      {/* CARD 2: CMV REAL DA FICHA TÉCNICA */}
      <div className="bg-white rounded-[24px] p-6 border border-zinc-200/60 shadow-sm shadow-zinc-300/20 select-none">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
            Custo de Mercadoria (CMV)
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-mono">
            {percentualCmvDiario}% do faturamento
          </span>
        </div>
        <h3 className="text-2xl font-extrabold tracking-tight text-zinc-700 font-mono mt-1">
          {formatarMoeda(dados.custoInsumosTotal)}
        </h3>
        <span className="text-[11px] font-semibold text-zinc-400 block mt-2">
          Custo escoado do estoque de hoje
        </span>
      </div>

      {/* CARD 3: LUCRO OPERACIONAL DA MESA */}
      <div className="bg-white rounded-[24px] p-6 border border-zinc-200/60 shadow-sm shadow-zinc-300/20 select-none">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E16349] block mb-1">
          Margem de Contribuição Bruta
        </span>
        <h3 className="text-2xl font-extrabold tracking-tight text-[#E16349] font-mono">
          {formatarMoeda(dados.lucroOperacionalBruto)}
        </h3>
        <span className="text-[11px] font-bold text-zinc-500 block mt-2">
          Saldo real antes do CPA do Meta
        </span>
      </div>

    </div>
  );
}
