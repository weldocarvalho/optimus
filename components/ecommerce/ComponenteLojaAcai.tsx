// components/ecommerce/ComponenteLojaAcai.tsx
'use client';

import React from 'react';
import { CardItemAcai } from './CardItemAcai';
import BarraCarrinhoFlutuante from './BarraCarrinhoFlutuante';

interface ProdutoCardapio {
  id: string;
  nome: string;
  descricao: string;
  preco_venda: number;
  disponivel: boolean;
}

interface ComponenteLojaAcaiProps {
  restaurante: { id: string; nome: string };
  produtos: ProdutoCardapio[];
}

export function ComponenteLojaAcai({ restaurante, produtos }: ComponenteLojaAcaiProps) {
  return (
    // Fundo cinza/creme ultra sutil para dar contraste máximo às "folhas de papel" brancas
    <div className="min-h-screen bg-[#F6F5F3] text-[#1A1A1A] antialiased pb-32 font-sans select-none">
      
      {/* CABEÇALHO: CONFIGURADO COMO UMA FOLHA DE PAPEL PREMIUM DO ROXO VELUDO */}
      <div className="max-w-xl mx-auto px-4 pt-6">
        <header className="bg-[#3B0D2C] border-b-[4px] border-[#7D1A52]/30 rounded-tl-[36px] rounded-br-[36px] rounded-tr-[12px] rounded-bl-[12px] p-6 shadow-xl shadow-purple-950/10 flex items-center gap-4 transition-transform duration-300 transform hover:scale-[1.01]">
          {/* Avatar Vetorial em Fundo Roxo Fechado */}
          <div className="w-11 h-11 rounded-full bg-[#2C0A21] border border-[#7D1A52]/30 flex items-center justify-center text-[#7D1A52] shrink-0 shadow-inner">
            <svg className="w-5 h-5 text-[#7D1A52]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3" />
            </svg>
          </div>
          <div className="leading-tight">
            <h1 className="font-black text-lg tracking-tight text-white uppercase">
              {restaurante.nome}
            </h1>
            <span className="text-[11px] font-bold tracking-tight text-purple-300/90 block mt-0.5">
              AceleraFood Tech
            </span>
          </div>
        </header>
      </div>

      {/* SEÇÃO DO CARDÁPIO PÚBLICO */}
      <div className="max-w-xl mx-auto px-4 mt-8">
        <div className="flex flex-col gap-1 px-2 mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cardápio</span>
          <h2 className="text-xl font-black tracking-tight text-zinc-900">Combinações Premium</h2>
        </div>

        {/* LISTAGEM DE PRODUTOS */}
        <div className="space-y-5">
          {produtos.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 bg-white rounded-[24px] border border-zinc-200/60 shadow-sm">
              <p className="font-bold text-xs">O cardápio está sendo atualizado.</p>
            </div>
          ) : (
            produtos.map((produto) => (
              <CardItemAcai key={produto.id} product={produto} />
            ))
          )}
        </div>
      </div>

      <BarraCarrinhoFlutuante ehAcai={true} />
    </div>
  );
}
