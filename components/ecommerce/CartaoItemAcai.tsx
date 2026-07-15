// components/ecommerce/CartaoItemAcai.tsx
'use client';

import React from 'react';
import { useCarrinho } from './ContextoCarrinho';
import { ItemCardapio } from '@/types/database';

interface ProdutoAcai {
  id: string;
  nome: string;
  descricao: string;
  preco_venda: number;
  disponivel: boolean;
}

interface CartaoItemAcaiProps {
  produto: ProdutoAcai;
}

export function CartaoItemAcai({ produto }: CartaoItemAcaiProps) {
  const { adicionarItem, itens, removerItem } = useCarrinho();

  const produtoNormalizado: ItemCardapio = {
    id: produto.id,
    restaurante_id: '',
    nome: produto.nome,
    descricao: produto.descricao,
    preco_venda: produto.preco_venda,
    disponivel: produto.disponivel,
    imagem_url: '',
    created_at: new Date().toISOString()
  };

  const itemNoCarrinho = itens.find(i => i.produto.id === produto.id);
  const qtd = itemNoCarrinho?.quantidade || 0;

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    // CARD EFEITO PAPEL: Cantos intencionalmente assimétricos, borda dupla sutil e sombra projetada marcante (shadow-md)
    <div className="bg-white border-t border-l border-zinc-100 border-b-[3px] border-r border-b-zinc-200/80 rounded-tl-[28px] rounded-br-[28px] rounded-tr-[10px] rounded-bl-[10px] p-4 flex gap-5 items-center shadow-md shadow-zinc-300/40 hover:shadow-xl hover:shadow-zinc-300/50 transition-all duration-300 transform hover:-translate-y-0.5">
      
      {/* THUMBNAIL DA IMAGEM: RECORTE ORGÂNICO PASTEL */}
      <div className="w-24 h-24 rounded-tl-[22px] rounded-br-[22px] rounded-tr-[8px] rounded-bl-[8px] bg-[#F9ECEF] border border-[#7D1A52]/5 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-200">
        <svg className="w-7 h-7 text-[#3B0D2C]/60" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3" />
        </svg>
      </div>

      {/* DETALHES COM ALTO CONTRASTE */}
      <div className="flex-1 min-w-0 pr-1">
        <h3 className="font-black text-zinc-950 tracking-tight text-sm sm:text-base leading-tight">
          {produto.nome}
        </h3>
        <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2 leading-relaxed font-bold">
          {produto.descricao || 'Combinação premium montada na hora com ingredientes frescos.'}
        </p>
        
        <div className="flex items-center justify-between mt-4">
          <span className="font-black text-[#3B0D2C] text-sm sm:text-base font-mono tracking-tight">
            {formatarMoeda(produto.preco_venda)}
          </span>

          {/* ACIONADORES OPERACIONAIS COMPACTOS */}
          {qtd > 0 ? (
            <div className="flex items-center bg-[#F3F3F3] rounded-[12px] p-1 gap-2.5 border border-zinc-200/30">
              <button 
                onClick={() => removerItem(produto.id)} 
                className="w-6 h-6 rounded-[8px] bg-white flex items-center justify-center text-xs font-black text-zinc-600 hover:bg-zinc-100 shadow-sm"
              >
                -
              </button>
              <span className="text-xs font-black px-0.5 text-zinc-800 font-mono">{qtd}</span>
              <button 
                onClick={() => adicionarItem(produtoNormalizado)} 
                className="w-6 h-6 rounded-[8px] bg-[#3B0D2C] hover:bg-[#2C0A25] flex items-center justify-center text-xs font-black text-white shadow-sm transition-colors"
              >
                +
              </button>
            </div>
          ) : (
            <button 
              onClick={() => adicionarItem(produtoNormalizado)}
              // Botão com raio de curvatura combinando com a folha de papel
              className="text-[#3B0D2C] bg-[#F9ECEF] border border-[#7D1A52]/10 hover:bg-[#f2d8e0] font-black text-[11px] px-4 py-2.5 rounded-tl-[14px] rounded-br-[14px] rounded-tr-[6px] rounded-bl-[6px] border-b-[2px] border-b-[#7D1A52]/20 active:scale-95 transition-all uppercase tracking-wider"
            >
              Adicionar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
