// components/ecommerce/CardItemBurger.tsx
'use client';

import React, { useState } from 'react';
import { useCarrinho } from './ContextoCarrinho';
import { ItemCardapio } from '@/types/database';

interface Adicional {
  id: string;
  nome: string;
  preco_adicional: number;
  disponivel: boolean;
}

interface ProdutoBurger {
  id: string;
  nome: string;
  descricao: string | null;
  preco_venda: number;
  imagem_url: string | null;
  complementos_produto: Adicional[];
}

interface CardItemBurgerProps {
  produto: ProdutoBurger;
}

export function CardItemBurger({ produto }: CardItemBurgerProps) {
  const { adicionarItem } = useCarrinho();
  const [estaExpandido, setEstaExpandido] = useState(false);
  const [adicionaisEscolhidos, setAdicionaisEscolhidos] = useState<Adicional[]>([]);

  // Mantido em Real (R$) conforme solicitado
  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleAlternarAdicional = (adicional: Adicional) => {
    setAdicionaisEscolhidos((prev) => {
      const jaSelecionado = prev.some((item) => item.id === adicional.id);
      if (jaSelecionado) {
        return prev.filter((item) => item.id !== adicional.id);
      } else {
        return [...prev, adicional];
      }
    });
  };

  const precoTotalAdicionais = adicionaisEscolhidos.reduce((acc, item) => acc + Number(item.preco_adicional), 0);
  const precoFinalComposto = Number(produto.preco_venda) + precoTotalAdicionais;

  const handleAdicionarAoCarrinho = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const produtoNormalizado: ItemCardapio = {
      id: produto.id,
      restaurante_id: '',
      nome: produto.nome,
      descricao: produto.descricao || '',
      preco_venda: precoFinalComposto,
      disponivel: true,
      imagem_url: produto.imagem_url || '',
      created_at: new Date().toISOString(),
      adicionais_selecionados: adicionaisEscolhidos.map((adicional) => ({
        id: adicional.id,
        nome: adicional.nome,
        preco: Number(adicional.preco_adicional)
      }))
    };

    adicionarItem(produtoNormalizado);
  };

  return (
    <div className="bg-white border-b border-zinc-100 overflow-hidden font-sans transition-all duration-300">
      
      {/* CORPO DO CARD - ALINHAMENTO IDÊNTICO À IMAGEM */}
      <div 
        onClick={() => setEstaExpandido(!estaExpandido)}
        className="p-4 flex gap-4 items-start cursor-pointer select-none hover:bg-zinc-50/20 transition-colors"
      >
        {/* Imagem do Produto à Esquerda */}
        <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-[#FAFAFA] border border-zinc-100 flex items-center justify-center">
          {produto.imagem_url ? (
            <img src={produto.imagem_url} alt={produto.nome} className="w-full h-full object-cover" />
          ) : (
            <svg className="w-10 h-10 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.562V12m0 3.562a3.375 3.375 0 1 1-6.75 0M21 15.562V19h-1.5M14.25 15.562V12m0 3.562a3.375 3.375 0 1 1-6.75 0M14.25 15.562V19h-6M7.5 15.562V12m0 3.562a3.375 3.375 0 1 1-6.75 0M7.5 15.562V19H2" />
            </svg>
          )}
        </div>

        {/* Metadados Alinhados Sem o Contador/Badge do Carrinho */}
        <div className="flex-1 min-w-0 relative">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-extrabold text-zinc-900 text-sm sm:text-base tracking-tight leading-tight">
              {produto.nome}
            </h3>
            <div className="text-zinc-400 shrink-0 mt-0.5">
              <svg className={`w-4 h-4 transition-transform duration-300 ${estaExpandido ? 'rotate-180 text-red-500' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
          
          <p className="text-zinc-500 text-[11px] leading-relaxed mt-1 font-normal pr-4">
            {produto.descricao}
          </p>

          {/* Preço Vermelho Espesso Alinhado Diretamente Abaixo da Descrição */}
          <div className="flex items-center mt-1.5">
            <span className="font-black text-[#E52521] text-sm sm:text-base">
              {formatarMoeda(Number(produto.preco_venda))}
            </span>
          </div>
        </div>
      </div>
      {/* SEÇÃO DE ADICIONAIS EXPANSÍVEL */}
      {estaExpandido && (
        <div className="px-4 pb-5 pt-1 bg-white animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Título da Gaveta em Português */}
          <div className="mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Adicionais</span>
          </div>

          {!produto.complementos_produto || produto.complementos_produto.length === 0 ? (
            <p className="text-xs text-zinc-400 italic py-1">Nenhum adicional cadastrado para este item.</p>
          ) : (
            <div className="space-y-3 mb-4">
              {produto.complementos_produto.filter(adi => adi.disponivel !== false).map((adi) => {
                const isChecked = adicionaisEscolhidos.some((item) => item.id === adi.id);
                return (
                  <div 
                    key={adi.id} 
                    onClick={() => handleAlternarAdicional(adi)}
                    className="flex items-center justify-between text-xs font-semibold cursor-pointer select-none py-0.5"
                  >
                    {/* Checkbox com Cantos Suaves */}
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        readOnly
                        className="w-4 h-4 rounded border-zinc-300 text-[#E52521] focus:ring-0 cursor-pointer accent-[#E52521]"
                      />
                      <span className="text-zinc-600 font-medium transition-colors">
                        {adi.nome}
                      </span>
                    </div>

                    {/* Preço do Adicional à Direita (Sem o ícone informativo "i") */}
                    <div className="flex items-center">
                      <span className="text-zinc-500 font-mono text-[11px]">
                        +{formatarMoeda(Number(adi.preco_adicional))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* BOTÃO CORRIGIDO: COR DO DESIGN, ÍCONE COM CÍRCULO À ESQUERDA E PREÇO À DIREITA */}
          <button
            type="button"
            onClick={handleAdicionarAoCarrinho}
            className="w-full bg-[#FFBC0D] hover:bg-[#e5a90b] active:bg-[#cc960a] text-zinc-900 font-black text-xs py-3.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-between"
          >
            {/* Bloco do Ícone (+) + Texto */}
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Adicionar ao carrinho</span>
            </div>

            {/* Preço Composto Isolado na Extremidade Direita */}
            <span className="font-mono">{formatarMoeda(precoFinalComposto)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
