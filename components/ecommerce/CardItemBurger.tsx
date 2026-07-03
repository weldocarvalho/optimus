// components/ecommerce/CardItemBurger.tsx
'use client';

import React from 'react';
import { useCarrinho } from './ContextoCarrinho';

interface ProdutoBurger {
  id: string;
  nome: string;
  descricao: string;
  preco_venda: number;
  disponivel: boolean;
}

interface CardItemBurgerProps {
  produto: ProdutoBurger;
}

export function CardItemBurger({ produto }: CardItemBurgerProps) {
  const { adicionarItem, itens, removerItem } = useCarrinho();
  
  // Normalização de tipagem para compatibilidade com o Contexto global
  const produtoNormalizado = {
    ...produto,
    restaurante_id: '',
    imagem_url: '',
    created_at: new Date().toISOString()
  };

  const itemNoCarrinho = itens.find(i => i.produto.id === produto.id);
  const qtd = itemNoCarrinho?.quantidade || 0;

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="bg-white border border-zinc-200/50 rounded-[24px] p-4 flex gap-4 shadow-sm shadow-zinc-200/40 items-center hover:border-zinc-300/80 transition-all select-none">
      
      {/* ÍCONE VETORIAL PURO EM DETACHED BOX (SUBSTITUI O EMOJI 🍔) */}
      <div className="w-20 h-20 rounded-[18px] flex items-center justify-center flex-shrink-0 text-amber-600 bg-amber-50 border border-amber-100/50 shadow-inner">
        <svg className="w-8 h-8 text-[#E16349]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.562V12m0 3.562a3.375 3.375 0 11-6.75 0M21 15.562V19h-1.5M14.25 15.562V12m0 3.562a3.375 3.375 0 11-6.75 0M14.25 15.562V19h-6M7.5 15.562V12m0 3.562a3.375 3.375 0 11-6.75 0M7.5 15.562V19H2" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-zinc-950 truncate text-sm sm:text-base leading-tight">
          {produto.nome}
        </h3>
        <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2 leading-relaxed font-medium">
          {produto.descricao || 'Grelhado artesanal preparado na brasa.'}
        </p>
        
        <div className="flex items-center justify-between mt-3.5">
          <span className="font-black text-emerald-600 text-sm sm:text-base font-mono">
            {formatarMoeda(produto.preco_venda)}
          </span>

          {qtd > 0 ? (
            <div className="flex items-center bg-[#F3F3F3] rounded-xl p-1 gap-3 border border-zinc-200/20">
              <button 
                onClick={() => removerItem(produto.id)} 
                className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-xs font-black text-zinc-600 hover:bg-zinc-100 shadow-sm"
              >
                -
              </button>
              <span className="text-xs font-bold px-0.5 text-zinc-800 font-mono">{qtd}</span>
              <button 
                onClick={() => adicionarItem(produtoNormalizado)} 
                className="w-6 h-6 rounded-lg bg-[#E16349] hover:bg-[#c8523a] flex items-center justify-center text-xs font-black text-white shadow-sm transition-colors"
              >
                +
              </button>
            </div>
          ) : (
            <button 
              onClick={() => adicionarItem(produtoNormalizado)}
              className="text-white bg-zinc-950 hover:bg-zinc-800 font-bold text-xs px-4 py-2 rounded-xl active:scale-95 transition-all shadow-sm uppercase tracking-wider text-[10px]"
            >
              Adicionar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
