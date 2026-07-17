// components/metricas/GraficoFunilGrowth.tsx
'use client';

import React from 'react';
import { ResumoMetricasFunil } from '@/actions/adminMetricas';

interface GraficoFunilGrowthProps {
  dados: ResumoMetricasFunil;
}

export function GraficoFunilGrowth({ dados }: GraficoFunilGrowthProps) {
  const taxaCheckouts = dados.visitas > 0 ? Math.round((dados.checkouts / dados.visitas) * 100) : 0;
  const isConversaoSaudavel = dados.taxaConversaoCardapio >= 2.5;

  return (
    <div className="bg-white rounded-[24px] p-6 border border-zinc-200/60 shadow-sm shadow-zinc-300/40 select-none space-y-8">
      
      {/* CABEÇALHO INTERNO */}
      <div className="border-b border-zinc-100 pb-3">
        <h3 className="text-base font-extrabold uppercase tracking-wider text-[#1A1A1A]">
          Funil de Vendas Líquido
        </h3>
        <span className="text-[11px] font-bold text-zinc-500 block mt-0.5">
          Silhueta estrutural de conversão e escoamento
        </span>
      </div>

      {/* ARQUITETURA ESCULPIDA DO FUNIL - SIMETRIA ATRAVÉS DE MARGENS HORIZONTAIS */}
      <div className="flex flex-col gap-1 mx-auto max-w-xl w-full">
        
        {/* CAMADA 1: TOPO (VISITAS) - LARGURA PLENA */}
        <div className="w-full">
          <div className="bg-[#F3F3F3] border border-zinc-200/60 rounded-t-[16px] rounded-b-[4px] p-4 flex items-center justify-between shadow-sm">
            <span className="tracking-tight uppercase text-[11px] font-extrabold text-[#1A1A1A]">
              1. Visitas ao Cardápio
            </span>
            <span className="font-mono text-zinc-900 font-extrabold bg-zinc-200/60 px-2.5 py-0.5 rounded-[8px] text-xs">
              {dados.visitas} acessos
            </span>
          </div>
        </div>

        {/* CAMADA 2: MEIO (CHECKOUTS) - SIMETRIA LATERAL VIA ENVELOPE (PX-4) */}
        <div className="px-4 w-full">
          <div className="bg-[#EBF1F5] border border-blue-200/60 text-blue-900 rounded-[4px] p-4 flex items-center justify-between shadow-sm">
            <span className="tracking-tight uppercase text-[11px] font-extrabold text-blue-950">
              2. Intenções de Compra
            </span>
            <span className="font-mono text-blue-950 font-extrabold bg-blue-200/50 px-2.5 py-0.5 rounded-[8px] text-xs">
              {dados.checkouts} ({taxaCheckouts}%)
            </span>
          </div>
        </div>

        {/* CAMADA 3: FUNDO (COMPRAS) - SIMETRIA LATERAL VIA ENVELOPE MÁXIMO (PX-8) */}
        <div className="px-8 w-full">
          <div 
            className={`rounded-t-[4px] rounded-b-[16px] p-4 flex items-center justify-between shadow-sm border transition-colors duration-300 ${
              isConversaoSaudavel 
                ? 'bg-[#EAF2EC] border-[#C8DCCE] text-[#2D5138]' 
                : 'bg-[#FCECE9] border-[#F4CDA5] text-[#A63A26]'
            }`}
          >
            <span className="tracking-tight uppercase text-[11px] font-extrabold">
              3. Pedidos Pagos (Stripe)
            </span>
            <span 
              className={`font-mono font-extrabold px-2.5 py-0.5 rounded-[8px] text-xs ${
                isConversaoSaudavel ? 'bg-[#D3E5D9]' : 'bg-[#F7D3CB]'
              }`}
            >
              {dados.compras} ({dados.taxaConversaoCardapio}%)
            </span>
          </div>
        </div>

      </div>

      {/* DETALHAMENTO DE INDICADORES BENTO */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-2 border-t border-zinc-100 text-xs">
        
        <div className="bg-white rounded-[16px] p-4 border border-zinc-200/80 shadow-sm">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 block mb-1">
            Abandono no Checkout
          </span>
          <span className="text-xl font-extrabold font-mono text-[#E16349] block">
            {dados.taxaAbandonoCarrinho}%
          </span>
          <span className="text-[12px] font-bold text-[#1A1A1A] block mt-1 leading-snug">
            Clientes que iniciaram o preenchimento dos dados mas recuaram na Stripe.
          </span>
        </div>

        <div className="bg-white rounded-[16px] p-4 border border-zinc-200/80 shadow-sm">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 block mb-1">
            Conversão Geral do Tráfego
          </span>
          <span 
            className={`text-xl font-extrabold font-mono block ${
              isConversaoSaudavel ? 'text-[#4A7856]' : 'text-zinc-700'
            }`}
          >
            {dados.taxaConversaoCardapio}%
          </span>
          <span className="text-[12px] font-bold text-[#1A1A1A] block mt-1 leading-snug">
            {isConversaoSaudavel 
              ? 'Performance excelente! O design e o produto superaram a média de mercado.' 
              : 'Média de mercado estável. Otimize os criativos do Meta Ads para atrair mais cliques.'}
          </span>
        </div>

      </div>
    </div>
  );
}
