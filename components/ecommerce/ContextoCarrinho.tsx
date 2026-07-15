// components/ecommerce/ContextoCarrinho.tsx
'use client';

import React, { createContext, useContext, useState } from 'react';
import { ItemCardapio } from '@/types/database';

// Definição estrita da estrutura de um item real armazenado na sacola de compras
export interface ItemCarrinho {
  produto: ItemCardapio;
  quantidade: number;
}

interface ContextoProps {
  itens: ItemCarrinho[];
  adicionarItem: (produto: ItemCardapio) => void;
  removerItem: (id: string) => void;
  limparCarrinho: () => void;
  totalItens: number;
  valorTotal: number;
}

const CarrinhoContext = createContext<ContextoProps | undefined>(undefined);

/**
 * Provedor global de estado do carrinho.
 * Gerencia a adição de produtos computando o preço dinâmico combinado com adicionais livres.
 */
export function ProvedorCarrinho({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);

  const adicionarItem = (produto: ItemCardapio) => {
    setItens(prev => {
      // Regra de Negócio: Identifica duplicidade na sacola considerando o ID do produto
      const existe = prev.find(i => i.produto.id === produto.id);
      if (existe) {
        return prev.map(i => 
          i.produto.id === produto.id 
            ? { ...i, quantidade: i.quantidade + 1 } 
            : i
        );
      }
      return [...prev, { produto, quantidade: 1 }];
    });
  };

  const removerItem = (id: string) => {
    setItens(prev => 
      prev
        .map(i => i.produto.id === id ? { ...i, quantidade: i.quantidade - 1 } : i)
        .filter(i => i.quantidade > 0)
    );
  };

  const limparCarrinho = () => setItens([]);

  // Redutores matemáticos para cálculo reativo de indicadores do e-commerce móvel
  const totalItens = itens.reduce((acc, i) => acc + i.quantidade, 0);
  
  // Computa o valor total multiplicando a quantidade pelo preço composto (base + adicionais)
  const valorTotal = itens.reduce((acc, i) => {
    return acc + (i.quantidade * Number(i.produto.preco_venda));
  }, 0);

  return (
    <CarrinhoContext.Provider value={{ 
      itens, 
      adicionarItem, 
      removerItem, 
      limparCarrinho, 
      totalItens, 
      valorTotal 
    }}>
      {children}
    </CarrinhoContext.Provider>
  );
}

export function useCarrinho() {
  const context = useContext(CarrinhoContext);
  if (!context) {
    throw new Error('useCarrinho deve ser usado estritamente dentro de um ProvedorCarrinho');
  }
  return context;
}
