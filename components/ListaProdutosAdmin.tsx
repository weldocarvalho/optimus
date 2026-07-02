// components/ListaProdutosAdmin.tsx
'use client';

import { useState, useTransition } from 'react';
import { ItemCardapioComCMV, atualizarStatusEmLote, criarProdutoComFichaTecnica, alternarDisponibilidadeProduto, InsumoVinculadoInput } from '@/actions/admin';
import { Insumo } from '@/types/database';
import { useRouter } from 'next/navigation';
import BarraAcoesLote from './cardapio-admin/BarraAcoesLote';
import CardProdutoAdmin from './cardapio-admin/CardProdutoAdmin';
import ModalNovoProduto from './cardapio-admin/ModalNovoProduto';

interface ListaProps {
  produtosIniciais: ItemCardapioComCMV[];
  insumosDisponiveis: Insumo[]; // Nova propriedade recebida do servidor
}

export default function ListaProdutosAdmin({ produtosIniciais, insumosDisponiveis }: ListaProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [modalAberto, setModalAberto] = useState(false);

  const handleToggleSelect = (id: string) => {
    setSelecionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    setSelecionados(selecionados.length === produtosIniciais.length ? [] : produtosIniciais.map(p => p.id));
  };

  const handleAlterarStatusLote = (disponivel: boolean) => {
    startTransition(async () => {
      if ((await atualizarStatusEmLote(selecionados, disponivel)).success) {
        setSelecionados([]); router.refresh();
      }
    });
  };

  const handleToggleStatusIndividual = (id: string, statusAtual: boolean) => {
    startTransition(async () => {
      if ((await alternarDisponibilidadeProduto(id, statusAtual)).success) router.refresh();
    });
  };

  // Chama a nova função enviando a árvore de ingredientes mapeada
  const handleCriarProduto = (nome: string, descricao: string, preco: number, insumos: InsumoVinculadoInput[]) => {
    startTransition(async () => {
      if ((await criarProdutoComFichaTecnica(nome, descricao, preco, insumos)).success) {
        setModalAberto(false); router.refresh();
      }
    });
  };

  return (
    <main className="bg-white rounded-[32px] shadow-sm shadow-zinc-300/40 border border-transparent overflow-hidden flex flex-col w-full relative">
      <div className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#F3F3F3]">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-[#1A1A1A]">Produtos & Inteligência Financeira</h1>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">Visão unificada de Ficha Técnica, CMV e Margem Real</p>
        </div>
        <button onClick={() => setModalAberto(true)} className="bg-[#E16349] text-white font-bold text-xs px-5 py-2.5 rounded-[16px] hover:bg-[#c8523a] active:scale-[0.97] transition-all shadow-sm">+ Adicionar Item</button>
      </div>

      <BarraAcoesLote todosSelecionados={produtosIniciais.length > 0 && selecionados.length === produtosIniciais.length} onSelecionarTodos={handleSelectAll} qtdSelecionados={selecionados.length} onAlterarStatus={handleAlterarStatusLote} isPending={isPending} />

      <div className="p-4 md:p-6 space-y-3">
        {produtosIniciais.map(p => (
          <CardProdutoAdmin key={p.id} produto={p} isSelecionado={selecionados.includes(p.id)} onToggleSelect={() => handleToggleSelect(p.id)} onToggleStatus={handleToggleStatusIndividual} />
        ))}
      </div>

      {/* Repassa a lista de insumos vinda do banco para o modal reativo */}
      <ModalNovoProduto aberto={modalAberto} onFechar={() => setModalAberto(false)} onSalvar={handleCriarProduto} isPending={isPending} insumosDisponiveis={insumosDisponiveis} />
    </main>
  );
}
