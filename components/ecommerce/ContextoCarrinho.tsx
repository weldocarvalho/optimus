'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ItemCardapio } from '@/types/database';

export interface ItemCarrinho {
  produto: ItemCardapio;
  quantidade: number;
}

interface ContextoCarrinhoType {
  itens: ItemCarrinho[];
  adicionarItem: (produto: ItemCardapio) => void;
  removerItem: (produtoId: string) => void;
  limparCarrinho: () => void;
  totalItens: number;
  valorTotal: number;
}

const ContextoCarrinho = createContext<ContextoCarrinhoType | undefined>(undefined);

export function ProvedorCarrinho({ children }: { children: React.ReactNode }) {
  // Inicializa o estado vazio para evitar incompatibilidade com SSR
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [carregado, setCarregado] = useState(false);

  // Chave única para o armazenamento local
  const LOCAL_STORAGE_KEY = 'acelera_food_carrinho';

  // 1. Carrega os dados salvos do localStorage assim que o componente monta no cliente
  useEffect(() => {
    try {
      const dadosSalvos = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (dadosSalvos) {
        setItens(JSON.parse(dadosSalvos));
      }
    } catch (error) {
      console.error('Erro ao ler do localStorage:', error);
    } finally {
      setCarregado(true);
    }
  }, []);

  // 2. Sincroniza o estado atualizado com o localStorage a cada mudança na sacola
  useEffect(() => {
    if (!carregado) return; // Bloqueia a execução antes do carregamento inicial
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(itens));
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }, [itens, carregado]);

  const adicionarItem = (produto: ItemCardapio) => {
    setItens((prev) => {
      const itemExistente = prev.find((i) => i.produto.id === produto.id);
      if (itemExistente) {
        return prev.map((i) =>
          i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      return [...prev, { produto, quantidade: 1 }];
    });
  };

  const removerItem = (produtoId: string) => {
    setItens((prev) => {
      const itemExistente = prev.find((i) => i.produto.id === produtoId);
      if (!itemExistente) return prev;
      if (itemExistente.quantidade === 1) {
        return prev.filter((i) => i.produto.id !== produtoId);
      }
      return prev.map((i) =>
        i.produto.id === produtoId ? { ...i, quantidade: i.quantidade - 1 } : i
      );
    });
  };

  const limparCarrinho = () => {
    setItens([]);
  };

  const totalItens = itens.reduce((acc, item) => acc + item.quantidade, 0);
  const valorTotal = itens.reduce((acc, item) => acc + item.quantidade * Number(item.produto.preco_venda), 0);

  // Evita oscilação de interface na tela (Layout Shift) durante a hidratação do Next.js
  if (!carregado) {
    return null; 
  }

  return (
    <ContextoCarrinho.Provider
      value={{
        itens,
        adicionarItem,
        removerItem,
        limparCarrinho,
        totalItens,
        valorTotal,
      }}
    >
      {children}
    </ContextoCarrinho.Provider>
  );
}

export function useCarrinho() {
  const contexto = useContext(ContextoCarrinho);
  if (!contexto) {
    throw new Error('useCarrinho deve ser utilizado dentro de um ProvedorCarrinho');
  }
  return contexto;
}
