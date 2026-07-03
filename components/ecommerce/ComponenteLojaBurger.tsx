// components/ecommerce/ComponenteLojaBurger.tsx
'use client';

import React from 'react';
import { CardItemBurger } from './CardItemBurger';
import BarraCarrinhoFlutuante from './BarraCarrinhoFlutuante';

interface ProdutoCardapio {
  id: string;
  nome: string;
  descricao: string;
  preco_venda: number;
  disponivel: boolean;
}

interface ComponenteLojaBurgerProps {
  restaurante: { id: string; nome: string };
  produtos: ProdutoCardapio[];
}

export function ComponenteLojaBurger({ restaurante, produtos }: ComponenteLojaBurgerProps) {
  return (
    <div className="min-h-screen bg-[#F3F3F3] text-[#1A1A1A] antialiased pb-32 font-sans">
      
      {/* BLOCO SUPERIOR COM BRANDING ENTERPRISE IDENTICO AO PAINEL ADM */}
      <div className="max-w-xl mx-auto px-4 pt-6">
        <header className="bg-white rounded-[24px] p-6 shadow-sm shadow-zinc-300/40 flex items-center gap-3.5 select-none border border-zinc-200/40">
          {/* Avatar Vetorial do Estabelecimento */}
          <div className="w-11 h-11 rounded-full bg-[#F3F3F3] border border-zinc-200/60 flex items-center justify-center text-zinc-400 shrink-0 shadow-inner">
            <svg className="w-5 h-5 text-[#E16349]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m0 0a3.001 3.001 0 00-3.75-.615A2.993 2.993 0 009.75 9.75c0 .358.063.702.18 1.025m10.965-1.426c.229-.112.483-.174.75-.174a1.5 1.5 0 011.5 1.5v6.75m-4.5-9a3.97 3.97 0 00-1.22-.112m-1.48 1.137A3.987 3.987 0 0112 11.25c-1.192 0-2.261-.523-3-1.362m-.75 0a3.987 3.987 0 01-3-1.362m0 0a3 3 0 00-3.75.615A2.993 2.993 0 001.5 9.75c0 .358.063.702.18 1.025m0 0A3.987 3.987 0 013 11.25c1.192 0 2.261-.523 3-1.362m0 0c.267.267.58.483.925.64" />
            </svg>
          </div>
          <div className="leading-tight">
            <h1 className="font-black text-lg tracking-tight text-[#1A1A1A] uppercase">
              {restaurante.nome}
            </h1>
            <span className="text-[11px] font-bold tracking-tight text-[#E16349] block mt-0.5">
              AceleraFood Tech
            </span>
          </div>
        </header>
      </div>

      {/* SEÇÃO DO CARDÁPIO PÚBLICO */}
      <div className="max-w-xl mx-auto px-4 mt-5">
        <div className="flex flex-col gap-1 px-2 mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cardápio</span>
          <h2 className="text-xl font-black tracking-tight text-zinc-900">Nossos Grelhados</h2>
        </div>

        <div className="space-y-3">
          {produtos.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 bg-white rounded-[24px] border border-zinc-200/40 shadow-sm">
              <p className="font-bold text-xs">Nenhum hambúrguer disponível no momento.</p>
            </div>
          ) : (
            produtos.map((produto) => (
              <CardItemBurger key={produto.id} produto={produto} />
            ))
          )}
        </div>
      </div>

      <BarraCarrinhoFlutuante ehAcai={false} />
    </div>
  );
}
