'use client';

import React, { useState } from 'react';
import { ItemCardapio } from '@/types/database';
import { Complemento, useCarrinho } from './ContextoCarrinho';

interface CardProps {
  produto: ItemCardapio;
}

export default function CartaoItemCardapio({ produto }: CardProps) {
  const { adicionarItem, itens, removerItem } = useCarrinho();
  const [sanfonaAberta, setSanfonaAberta] = useState(false);
  const [complementosSelecionadosIds, setComplementosSelecionadosIds] = useState<string[]>([]);

  const complementosDisponiveis = (produto.complementos_produto || []).filter((complemento) => complemento.disponivel);
  const complementosSelecionados = complementosDisponiveis
    .filter((complemento) => complementosSelecionadosIds.includes(complemento.id))
    .map<Complemento>((complemento) => ({
      id: complemento.id,
      item_cardapio_id: complemento.item_cardapio_id || produto.id,
      nome: complemento.nome,
      preco_adicional: Number(complemento.preco_adicional),
      disponivel: complemento.disponivel,
    }));

  const adicionaisIds = complementosSelecionados.map((adicional) => adicional.id).sort().join('-');
  const idUnicoCarrinho = adicionaisIds ? `${produto.id}-${adicionaisIds}` : produto.id;
  const itemNoCarrinho = itens.find((item) => item.idUnico === idUnicoCarrinho);
  const qtd = itemNoCarrinho?.quantidade || 0;

  const valorComplementosSelecionados = complementosSelecionados.reduce(
    (acc, adicional) => acc + Number(adicional.preco_adicional),
    0
  );

  const toggleComplemento = (complementoId: string) => {
    setComplementosSelecionadosIds((idsAtuais) =>
      idsAtuais.includes(complementoId)
        ? idsAtuais.filter((id) => id !== complementoId)
        : [...idsAtuais, complementoId]
    );
  };

  return (
    <div className="bg-white border border-zinc-200/50 rounded-[24px] shadow-sm overflow-hidden transition-all">
      <div
        onClick={() => setSanfonaAberta(!sanfonaAberta)}
        className="p-4 flex gap-4 items-center cursor-pointer select-none hover:bg-zinc-50/50 transition-colors"
      >
        <div className="w-16 h-16 rounded-[18px] flex items-center justify-center flex-shrink-0 text-2xl bg-amber-50 text-amber-600 shadow-inner">
          🍔
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-zinc-950 truncate text-xs sm:text-sm leading-tight">
            {produto.nome}
          </h3>
          <p className="text-zinc-400 text-[11px] mt-1 line-clamp-1 leading-relaxed font-medium">
            {produto.descricao || 'Receita artesanal montada com insumos selecionados.'}
          </p>
          <span className="font-black text-zinc-900 text-xs sm:text-sm block mt-2 font-mono">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(produto.preco_venda))}
          </span>
        </div>

        <div className="shrink-0 p-1 text-zinc-400">
          <svg
            className={`w-4 h-4 transform transition-transform duration-200 ${sanfonaAberta ? 'rotate-180 text-zinc-800' : ''}`}
            fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {sanfonaAberta && (
        <div className="border-t border-zinc-100 bg-zinc-50/50 p-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex justify-between items-center select-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Turbine seu pedido</span>
            {qtd > 0 && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                Item na sacola
              </span>
            )}
          </div>

          <div className="space-y-2">
            {complementosDisponiveis.length === 0 ? (
              <div className="bg-white border border-zinc-200/40 rounded-xl p-3 text-[11px] font-bold text-zinc-500">
                Este item não possui complementos no momento.
              </div>
            ) : (
              complementosDisponiveis.map((complemento) => {
                const selecionado = complementosSelecionadosIds.includes(complemento.id);
                return (
                  <button
                    key={complemento.id}
                    type="button"
                    onClick={() => toggleComplemento(complemento.id)}
                    className={`w-full bg-white border rounded-xl p-3 flex justify-between items-center shadow-2xs transition-all ${
                      selecionado ? 'border-zinc-900' : 'border-zinc-200/40 hover:border-zinc-400'
                    }`}
                  >
                    <div className="text-left">
                      <span className="text-xs font-bold text-zinc-800 block">{complemento.nome}</span>
                      <span className="text-[11px] font-extrabold text-zinc-500 font-mono">
                        + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(complemento.preco_adicional))}
                      </span>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center text-[10px] font-black ${
                        selecionado
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-white text-zinc-400 border-zinc-300'
                      }`}
                    >
                      {selecionado ? '✓' : '+'}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {complementosSelecionados.length > 0 && (
            <div className="text-[11px] font-bold text-zinc-600 flex justify-between">
              <span>Complementos selecionados</span>
              <span className="font-mono">
                + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorComplementosSelecionados)}
              </span>
            </div>
          )}

          <div className="pt-2 flex justify-between items-center border-t border-zinc-100/80">
            <span className="text-xs font-medium text-zinc-500">Quantidade</span>
            {qtd > 0 ? (
              <div className="flex items-center bg-zinc-100 border border-zinc-200/40 rounded-xl p-0.5 gap-2.5">
                <button
                  type="button"
                  onClick={() => removerItem(idUnicoCarrinho)}
                  className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-xs font-black text-zinc-600 hover:bg-zinc-200 shadow-2xs transition-colors"
                >
                  -
                </button>
                <span className="text-xs font-black px-0.5 text-zinc-800 font-mono">{qtd}</span>
                <button
                  type="button"
                  onClick={() => adicionarItem(produto, complementosSelecionados)}
                  className="w-6 h-6 rounded-lg bg-zinc-900 flex items-center justify-center text-xs font-black text-white hover:bg-zinc-800 shadow-2xs transition-colors"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => adicionarItem(produto, complementosSelecionados)}
                className="bg-zinc-900 hover:bg-zinc-800 text-white font-black text-[11px] px-4 py-2 rounded-xl transition-all uppercase tracking-wider"
              >
                Adicionar à Sacola
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
