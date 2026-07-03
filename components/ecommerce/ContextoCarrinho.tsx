// components/ecommerce/ContextoCarrinho.tsx
'use client';

import React, { createContext, useContext, useState } from 'react';
import { ItemCardapio } from '@/types/database';

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

export function ProvedorCarrinho({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);

  const adicionarItem = (produto: ItemCardapio) => {
    setItens(prev => {
      const existe = prev.find(i => i.produto.id === produto.id);
      if (existe) {
        return prev.map(i => i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { produto, quantity: 1, quantidade: 1 }]; // Mantém compatibilidade interna
    });
  };

  // CORREÇÃO DO BUG: Alinhamos a propriedade estritamente para 'quantidade'
  const removerItem = (id: string) => {
    setItens(prev => 
      prev
        .map(i => i.produto.id === id ? { ...i, quantidade: i.quantidade - 1 } : i)
        .filter(i => i.quantidade > 0)
    );
  };

  const limparCarrinho = () => setItens([]);
  const totalItens = itens.reduce((acc, i) => acc + i.quantidade, 0);
  const valorTotal = itens.reduce((acc, i) => acc + (i.quantidade * Number(i.produto.preco_venda)), 0);

  return (
    <CarrinhoContext.Provider value={{ itens, adicionarItem, removerItem, limparCarrinho, totalItens, valorTotal }}>
      {children}
    </CarrinhoContext.Provider>
  );
}

export function useCarrinho() {
  const context = useContext(CarrinhoContext);
  if (!context) throw new Error('useCarrinho deve ser usado dentro de um ProvedorCarrinho');
  return context;
}
