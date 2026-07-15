// components/ecommerce/ComponenteLojaAcai.tsx (Parte 1 de 2)
'use client';

import React from 'react';
import { CartaoItemAcai } from './CartaoItemAcai';
import BarraCarrinhoFlutuante from './BarraCarrinhoFlutuante';
import { APP_BRAND_NAME } from '@/utils/branding';

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

export default function ComponenteLojaAcai({ restaurante, produtos }: ComponenteLojaAcaiProps) {
  return (
    // Fundo cinza/creme ultra sutil para dar contraste máximo às folhas de papel brancas
    <div className="min-h-screen bg-[#F6F5F3] text-[#1A1A1A] antialiased pb-32 font-sans select-none">
      
      {/* 1. CABEÇALHO COM LARGURA TOTAL: Configurado com a folha de papel premium do Roxo Veludo */}
      <div className="w-full bg-[#3B0D2C] border-b-[4px] border-[#7D1A52]/30 text-white shadow-xl shadow-purple-950/10 transition-transform duration-300">
        <header className="w-full max-w-xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Botão de Menu Hambúrguer Minimalista Retrô */}
            <button className="text-purple-300 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="leading-tight">
              <h1 className="font-black text-lg tracking-tight uppercase text-white">
                {restaurante.nome}
              </h1>
              <span className="text-[10px] font-bold tracking-widest text-purple-300/90 block mt-0.5 uppercase">
                {APP_BRAND_NAME}
              </span>
            </div>
          </div>

          {/* Ícone de Sacola Superior Nativo da Açaiteria */}
          <div className="relative text-purple-300 hover:text-white transition-colors cursor-pointer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
          </div>
        </header>
      </div>

      {/* 2. MENU DE CATEGORIAS EMOCIONAIS COM LARGURA TOTAL */}
      <div className="w-full bg-white border-b border-zinc-200/50 shadow-sm">
        <nav className="w-full max-w-xl mx-auto px-6 py-3.5 flex items-center gap-6 text-xs font-black uppercase tracking-wider text-zinc-400 overflow-x-auto scrollbar-none">
          <button className="text-[#3B0D2C] border-b-2 border-[#3B0D2C] pb-1 shrink-0">✨ Todos</button>
          <button className="hover:text-zinc-900 transition-colors pb-1 shrink-0">💪 Fitness</button>
          <button className="hover:text-zinc-900 transition-colors pb-1 shrink-0">🍓 Sobremesas</button>
          <button className="hover:text-zinc-900 transition-colors pb-1 shrink-0">👑 Da Casa</button>
        </nav>
      </div>

      {/* 3. SEÇÃO DO CARDÁPIO PÚBLICO (ALINHADA À MARGEM DO CHECKOUT) */}
      {/* max-w-xl limita a largura útil e o px-6 cria a mesma margem interna idêntica ao checkout */}
      <div className="w-full max-w-xl mx-auto px-6 mt-8">
        <div className="flex flex-col gap-1 mb-4 select-none">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cardápio</span>
          <h2 className="text-xl font-black tracking-tight text-zinc-900">Combinações Premium</h2>
        </div>

        {/* LISTAGEM DE PRODUTOS COMPATÍVEL COM O GRID SULCADO DO CHECKOUT */}
        <div className="space-y-4">
          {produtos.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 bg-white rounded-[24px] border border-zinc-200/60 shadow-sm">
              <p className="font-bold text-xs">O cardápio está sendo atualizado.</p>
            </div>
          ) : (
            produtos.map((produto) => (
              <CartaoItemAcai key={produto.id} produto={produto} />
            ))
          )}
        </div>
      </div>

      {/* Barra de Sacola Flutuante com Injeção de Contexto do Roxo Ativo */}
      <BarraCarrinhoFlutuante ehAcai={true} />
    </div>
  );
}
