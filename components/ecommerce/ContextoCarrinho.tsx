// components/ecommerce/ContextoCarrinho.tsx
'use client';

import React, { createContext, useContext, useState } from 'react';

export interface Complemento {
  id: string;
  item_cardapio_id: string;
  nome: string;
  preco_adicional: number;
  disponivel: boolean;
}

export interface ItemCardapio {
  id: string;
  restaurante_id: string;
  nome: string;
  descricao: string | null;
  preco_venda: number;
  disponivel: boolean;
  imagem_url: string | null;
  complementos?: Complemento[];
}

export interface ItemCarrinho {
  idUnico: string; // Chave composta calculada reativamente
  produto: ItemCardapio;
  quantidade: number;
  adicionaisEscolhidos: Complemento[];
}

interface ContextoCarrinhoType {
  itens: ItemCarrinho[];
  adicionarItem: (produto: ItemCardapio, adicionais?: Complemento[]) => void;
  removerItem: (idUnico: string) => void;
  valorTotal: number;
  totalItens: number;
  limparCarrinho: () => void;
}

const ContextoCarrinho = createContext<ContextoCarrinhoType | undefined>(undefined);

export function ProvedorCarrinho({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);

  const adicionarItem = (produto: ItemCardapio, adicionais: Complemento[] = []) => {
    setItens((itensAtuais) => {
      const adicionaisIds = adicionais.map(a => a.id).sort().join('-');
      const idUnico = adicionaisIds ? `${produto.id}-${adicionaisIds}` : produto.id;

      const itemExistente = itensAtuais.find((item) => item.idUnico === idUnico);

      if (itemExistente) {
        return itensAtuais.map((item) =>
          item.idUnico === idUnico ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      }

      const precoAdicionais = adicionais.reduce((acc, a) => acc + Number(a.preco_adicional), 0);
      const produtoPrecoFinal = {
        ...produto,
        preco_venda: Number(produto.preco_venda) + precoAdicionais
      };

      return [
        ...itensAtuais,
        {
          idUnico,
          produto: produtoPrecoFinal,
          quantidade: 1,
          adicionaisEscolhidos: adicionais
        }
      ];
    });
  };

  const removerItem = (idUnico: string) => {
    setItens((itensAtuais) => {
      const itemExistente = itensAtuais.find((item) => item.idUnico === idUnico);

      if (itemExistente && itemExistente.quantidade > 1) {
        return itensAtuais.map((item) =>
          item.idUnico === idUnico ? { ...item, quantidade: item.quantidade - 1 } : item
        );
      }

      return itensAtuais.filter((item) => item.idUnico !== idUnico);
    });
  };

  const limparCarrinho = () => setItens([]);

  const valorTotal = itens.reduce((acc, item) => acc + (item.produto.preco_venda * item.quantidade), 0);
  const totalItens = itens.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <ContextoCarrinho.Provider value={{ itens, adicionarItem, removerItem, valorTotal, totalItens, limparCarrinho }}>
      {children}
    </ContextoCarrinho.Provider>
  );
}

export function useCarrinho() {
  const context = useContext(ContextoCarrinho);
  if (!context) {
    throw new Error('useCarrinho deve ser utilizado dentro de um ProvedorCarrinho');
  }
  return context;
}
