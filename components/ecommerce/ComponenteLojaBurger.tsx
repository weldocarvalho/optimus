// components/ecommerce/ComponenteLojaBurger.tsx
'use client';

import React, { useState } from 'react';
import { CardItemBurger } from './CardItemBurger';
import BarraCarrinhoFlutuante from './BarraCarrinhoFlutuante';
import { useCarrinho } from './ContextoCarrinho';

interface Adicional {
  id: string;
  nome: string;
  preco_adicional: number;
  disponivel: boolean;
}

interface ProdutoCardapio {
  id: string;
  nome: string;
  descricao: string | null;
  preco_venda: number;
  imagem_url: string | null;
  complementos_produto: Adicional[];
}

interface ComponenteLojaBurgerProps {
  restaurante: { id: string; nome: string; tipo: string };
  produtos: ProdutoCardapio[];
}

type CategoriaMenu = 'HAMBURGUERES' | 'BEBIDAS' | 'COMBOS';

export function ComponenteLojaBurger({ restaurante, produtos }: ComponenteLojaBurgerProps) {
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaMenu>('HAMBURGUERES');
  const { totalItens } = useCarrinho();

  const produtosFiltrados = produtos.filter((p) => {
    const desc = (p.descricao || '').toLowerCase();
    const nome = p.nome.toLowerCase();

    if (categoriaAtiva === 'BEBIDAS') {
      return desc.includes('refrigerante') || desc.includes('suco') || desc.includes('água') || 
             desc.includes('lata') || nome.includes('bebida') || nome.includes('coca') || 
             nome.includes('guaraná') || nome.includes('drink') || nome.includes('suco');
    }
    if (categoriaAtiva === 'COMBOS') {
      return desc.includes('combo') || desc.includes('batata +') || nome.includes('combo') || 
             nome.includes('dupla') || nome.includes('trio');
    }
    
    const ehBebida = desc.includes('refrigerante') || desc.includes('suco') || nome.includes('coca') || nome.includes('guaraná');
    const ehCombo = desc.includes('combo') || nome.includes('combo');
    return !ehBebida && !ehCombo;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] antialiased pb-32 font-sans selection:bg-red-600 selection:text-white">
      
      {/* HEADER VERMELHO: CORRIGIDO - 100% PLANO, SEM NENHUM RELEVO OU SOMBRA */}
      <div className="w-full bg-[#E52521] px-4 pt-3 pb-4 sticky top-0 z-30">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button className="text-white focus:outline-none py-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          
          <div className="flex flex-col items-center select-none translate-x-3">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-[#FFC72C]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 11.5c0-.83-.67-1.5-1.5-1.5H3.5C2.67 10 2 10.67 2 11.5c0 .34.12.65.31.9c-.19.34-.31.73-.31 1.15c0 .7.4 1.3 1 1.61c-.01.11-.01.23-.01.34c0 1.93 1.57 3.5 3.5 3.5h11c1.93 0 3.5-1.57 3.5-3.5c0-.11 0-.23-.01-.34c.6-.31 1-.91 1-1.61c0-.42-.12-.81-.31-1.15c.19-.25.31-.56.31-.9M12 2C6.48 2 2 5 2 7c0 .54.33 1.04.88 1.44C3.82 9.02 5.6 9.5 7.5 9.5c1.47 0 2.87-.29 4-.79c1.13.5 2.53.79 4 .79c1.9 0 3.68-.48 4.62-1.06c.55-.4.88-.9.88-1.44c0-2-4.48-5-10-5z" />
              </svg>
              <h1 className="font-serif italic font-black text-2xl tracking-tighter text-white leading-none">
                Burger
              </h1>
            </div>
            <span className="text-[10px] font-bold tracking-widest text-[#FFC72C] uppercase block mt-0.5">
              House
            </span>
          </div>

          <div className="relative cursor-pointer">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1,0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0,1-1.12-1.243l1.264-12A1.125 1.125 0 0,1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1,1-.75 0 .375.375 0 0,1 .75 0Zm7.5 0a.375.375 0 1,1-.75 0 .375.375 0 0,1 .75 0Z" />
            </svg>
            {totalItens > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#FFC72C] text-zinc-900 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#E52521]">
                {totalItens}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* BARRA DE CATEGORIAS: CORRIGIDO - 100% PLANA, SEM NENHUM RELEVO OU SOMBRA */}
      <div className="w-full bg-[#FFC72C] px-3 py-2.5 sticky top-[68px] z-20">
        <nav className="max-w-xl mx-auto flex items-center justify-between gap-1 overflow-x-auto scrollbar-none text-xs font-bold text-zinc-800">
          
          <button 
            type="button"
            onClick={() => setCategoriaAtiva('HAMBURGUERES')} 
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl transition-all font-extrabold tracking-tight ${
              categoriaAtiva === 'HAMBURGUERES' ? 'bg-[#E52521] text-white shadow-sm' : 'hover:bg-amber-400/50'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.562V12m0 3.562a3.375 3.375 0 11-6.75 0M21 15.562V19h-1.5M14.25 15.562V12m0 3.562a3.375 3.375 0 11-6.75 0M14.25 15.562V19h-6M7.5 15.562V12m0 3.562a3.375 3.375 0 11-6.75 0M7.5 15.562V19H2" />
            </svg>
            Hambúrgueres
          </button>

          <button 
            type="button"
            onClick={() => setCategoriaAtiva('BEBIDAS')} 
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl transition-all font-extrabold tracking-tight ${
              categoriaAtiva === 'BEBIDAS' ? 'bg-[#E52521] text-white shadow-sm' : 'hover:bg-amber-400/50'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 11V20c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V11M2 8h20M17 5l-2-3H9L7 5M12 8v14" />
            </svg>
            Bebidas
          </button>

          <button 
            type="button"
            onClick={() => setCategoriaAtiva('COMBOS')} 
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl transition-all font-extrabold tracking-tight ${
              categoriaAtiva === 'COMBOS' ? 'bg-[#E52521] text-white shadow-sm' : 'hover:bg-amber-400/50'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM9.75 9.75h4.5m-4.5 4.5h4.5" />
            </svg>
            Combos
          </button>

        </nav>
      </div>

      {/* ESTEIRA DE CARDS: CADA HAMBÚRGUER É UM CARD INDEPENDENTE COM RELEVO E BORDAS ARREDONDADAS (IGUAL AO DESIGN) */}
      <div className="max-w-xl mx-auto mt-4 px-3 space-y-4">
        {produtosFiltrados.length === 0 ? (
          <div className="text-center py-20 text-zinc-400 bg-white rounded-2xl border border-zinc-100 shadow-sm px-4">
            <p className="font-semibold text-xs tracking-wide">Nenhum item disponível nesta categoria.</p>
          </div>
        ) : (
          produtosFiltrados.map((produto) => (
            <div key={produto.id} className="bg-white rounded-2xl border border-zinc-100/80 shadow-[0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
              <CardItemBurger produto={produto} />
            </div>
          ))
        )}
      </div>

      <BarraCarrinhoFlutuante ehAcai={false} />
    </div>
  );
}
