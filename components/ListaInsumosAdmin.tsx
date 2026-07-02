// components/ListaInsumosAdmin.tsx
'use client';

import { useState, useTransition } from 'react';
import { Insumo } from '@/types/database';
import { criarInsumoAdmin, excluirInsumosEmLote, atualizarCustoInsumoAdmin } from '@/actions/adminInsumos';
import { useRouter } from 'next/navigation';
import CardInsumoAdmin from './insumos-admin/CardInsumoAdmin';
import ModalNovoInsumo from './insumos-admin/ModalNovoInsumo';
import ModalEditarInsumo from './insumos-admin/ModalEditarInsumo';

interface ListaProps {
  insumosIniciais: Insumo[];
}

export default function ListaInsumosAdmin({ insumosIniciais }: ListaProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selecionados, setSelecionados] = useState<string[]>([]);
  
  // Estados para Controle dos Modais Bento
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [insumoParaEditar, setInsumoParaEditar] = useState<Insumo | null>(null);

  const handleToggleSelect = (id: string) => {
    setSelecionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    setSelecionados(selecionados.length === insumosIniciais.length ? [] : insumosIniciais.map(i => i.id));
  };

  const handleExcluirLote = () => {
    if (selecionados.length === 0) return;
    if (!confirm('Deseja realmente excluir os insumos? Isso afetará o cálculo do CMV das fichas técnicas.')) return;

    startTransition(async () => {
      if ((await excluirInsumosEmLote(selecionados)).success) {
        setSelecionados([]); router.refresh();
      }
    });
  };

  const handleSalvarNovoInsumo = (nome: string, unidade: 'g' | 'ml' | 'un', custo: number, atual: number, minimo: number) => {
    startTransition(async () => {
      if ((await criarInsumoAdmin(nome, unidade, custo, atual, minimo)).success) {
        setModalNovoAberto(false); router.refresh();
      }
    });
  };

  // Dispara a atualização do custo e fecha o modal reativamente
  const handleAtualizarInsumo = (id: string, custo: number, estoque: number, minimo: number) => {
    startTransition(async () => {
      if ((await atualizarCustoInsumoAdmin(id, custo, estoque, minimo)).success) {
        setInsumoParaEditar(null); router.refresh();
      }
    });
  };

  const todosSelecionados = insumosIniciais.length > 0 && selecionados.length === insumosIniciais.length;

  return (
    <main className="bg-white rounded-[32px] shadow-sm shadow-zinc-300/40 border border-transparent overflow-hidden flex flex-col w-full relative">
      <div className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#F3F3F3]">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-[#1A1A1A]">Matérias-Primas & Custos</h1>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">Gerenciamento de estoque e valores de compra dos fornecedores</p>
        </div>
        <button onClick={() => setModalNovoAberto(true)} className="bg-[#E16349] text-white font-bold text-xs px-5 py-2.5 rounded-[16px] hover:bg-[#c8523a] active:scale-[0.97] transition-all shadow-sm">+ Novo Insumo</button>
      </div>

      <div className="px-6 py-4 bg-[#F8F8F8]/60 border-b border-[#F3F3F3] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={todosSelecionados} onChange={handleSelectAll} className="w-4 h-4 rounded-md border-zinc-300 text-[#E16349] cursor-pointer accent-[#E16349]" />
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{selecionados.length > 0 ? `${selecionados.length} selecionados` : 'Selecionar Todos'}</span>
        </div>
        <button onClick={handleExcluirLote} disabled={selecionados.length === 0 || isPending} className={`px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 font-bold text-[11px] rounded-lg transition-all ${selecionados.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>Excluir Selecionados</button>
      </div>

      <div className="p-4 md:p-6 space-y-3">
        {insumosIniciais.length === 0 ? (
          <div className="text-center py-20 text-zinc-400"><p className="font-bold text-xs">Nenhum insumo no estoque.</p></div>
        ) : (
          insumosIniciais.map(insumo => (
            <CardInsumoAdmin 
              key={insumo.id} 
              insumo={insumo} 
              isSelecionado={selecionados.includes(insumo.id)} 
              onToggleSelect={() => handleToggleSelect(insumo.id)} 
              onEditarClick={(ins) => setInsumoParaEditar(ins)} // Repassa o clique abrindo o modal de edição
            />
          ))
        )}
      </div>

      {/* MODAL 1: Cadastro de Insumo (Via Portal) */}
      <ModalNovoInsumo aberto={modalNovoAberto} onFechar={() => setModalNovoAberto(false)} onSalvar={handleSalvarNovoInsumo} isPending={isPending} />

      {/* MODAL 2: Edição de Insumo (Via Portal) */}
      <ModalEditarInsumo insumo={insumoParaEditar} onFechar={() => setInsumoParaEditar(null)} onSalvar={handleAtualizarInsumo} isPending={isPending} />
    </main>
  );
}
