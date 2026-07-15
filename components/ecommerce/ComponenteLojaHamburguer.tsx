// components/ecommerce/ComponenteLojaHamburguer.tsx
'use client';

import React from 'react';
import { ItemCardapio } from '@/types/database';
import CartaoItemCardapio from './CartaoItemCardapio';
import BarraCarrinhoFlutuante from './BarraCarrinhoFlutuante';

interface ComponenteLojaHamburguerProps {
  restaurante: { id: string; nome: string };
  produtos: ItemCardapio[];
}

export default function ComponenteLojaHamburguer({ restaurante, produtos }: ComponenteLojaHamburguerProps) {
  return (
    <div className="min-h-screen bg-[#F6F5F3] text-[#1A1A1A] antialiased pb-32 font-sans select-none">
      <div className="w-full bg-[#E52521] text-white">
        <header className="w-full max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="text-white hover:opacity-80">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="font-black text-lg tracking-tight uppercase">{restaurante.nome}</h1>
          </div>
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
          </div>
        </header>
      </div>

      <div className="w-full bg-[#FFC72C] border-b border-amber-500/20">
        <nav className="w-full max-w-xl mx-auto px-6 py-3.5 flex items-center justify-between text-xs font-black uppercase tracking-wider text-zinc-900 overflow-x-auto scrollbar-none">
          <button className="bg-[#E52521] text-white px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">🍔 Hambúrgueres</button>
          <button className="opacity-75 hover:opacity-100 py-2">🥤 Bebidas</button>
          <button className="opacity-75 hover:opacity-100 py-2">✨ Combos</button>
        </nav>
      </div>

      <div className="w-full max-w-xl mx-auto px-6 mt-8">
        <div className="flex flex-col gap-1 mb-4 select-none">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cardápio</span>
          <h2 className="text-xl font-black tracking-tight text-zinc-900">Os Mais Vendidos</h2>
        </div>

        <div className="space-y-4">
          {produtos.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 bg-white rounded-2xl border border-zinc-200/60 shadow-sm">
              <p className="font-bold text-xs">O cardápio está sendo atualizado.</p>
            </div>
          ) : (
            produtos.map((produto) => (
              <CartaoItemCardapio 
                key={produto.id} 
                produto={produto} 
              />
            ))
          )}
        </div>
      </div>

      <BarraCarrinhoFlutuante ehAcai={false} />
    </div>
  );
}
