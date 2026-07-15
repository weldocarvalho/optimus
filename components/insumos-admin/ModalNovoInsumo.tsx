// components/insumos-admin/ModalNovoInsumo.tsx
'use client';

import { useState } from 'react';

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (nome: string, unidade: 'g' | 'ml' | 'un', custo: number, estoqueAtual: number, estoqueMinimo: number) => void;
  isPending: boolean;
}

type UnidadeMedida = 'g' | 'ml' | 'un';

export default function ModalNovoInsumo({ aberto, onFechar, onSalvar, isPending }: ModalProps) {
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState<UnidadeMedida>('un');
  const [custo, setCusto] = useState('');
  const [estoqueAtual, setEstoqueAtual] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');

  const handleUnidadeChange = (value: string) => {
    if (value === 'g' || value === 'ml' || value === 'un') {
      setUnidade(value);
    }
  };

  if (!aberto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !custo) return;
    onSalvar(
      nome, 
      unidade, 
      parseFloat(custo), 
      estoqueAtual ? parseFloat(estoqueAtual) : 0, 
      estoqueMinimo ? parseFloat(estoqueMinimo) : 0
    );
    setNome(''); setCusto(''); setEstoqueAtual(''); setEstoqueMinimo('');
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/20 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-200">
      <div className="bg-white rounded-[28px] border border-zinc-100 shadow-2xl shadow-zinc-400/40 w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-[#F3F3F3] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold tracking-tight text-[#1A1A1A]">Nova Matéria-Prima</h2>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">Gestão de Custos</p>
          </div>
          <button type="button" onClick={onFechar} className="w-6 h-6 bg-[#F3F3F3] hover:bg-zinc-200 text-zinc-500 rounded-full flex items-center justify-center transition-colors text-[10px] font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Nome do Insumo</label>
            <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Queijo Cheddar Fatiado" className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#E16349] focus:ring-1 focus:ring-[#E16349] placeholder-zinc-400" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Unidade de Medida</label>
              <select value={unidade} onChange={(e) => handleUnidadeChange(e.target.value)} className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#E16349] focus:ring-1 focus:ring-[#E16349] cursor-pointer">
                <option value="un">Unidade (un)</option>
                <option value="g">Grama (g)</option>
                <option value="ml">Mililitro (ml)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Custo Unitário (R$)</label>
              <input type="number" step="0.0001" required value={custo} onChange={(e) => setCusto(e.target.value)} placeholder="0,00" className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#E16349] focus:ring-1 focus:ring-[#E16349] placeholder-zinc-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Estoque Inicial</label>
              <input type="number" step="0.01" value={estoqueAtual} onChange={(e) => setEstoqueAtual(e.target.value)} placeholder="0" className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#E16349] focus:ring-1 focus:ring-[#E16349] placeholder-zinc-400" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Alerta Mínimo</label>
              <input type="number" step="0.01" value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(e.target.value)} placeholder="0" className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#E16349] focus:ring-1 focus:ring-[#E16349] placeholder-zinc-400" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onFechar} className="flex-1 py-2.5 bg-[#F3F3F3] text-zinc-500 font-bold text-xs rounded-[14px] hover:bg-zinc-200">Cancelar</button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-[#E16349] text-white font-bold text-xs rounded-[14px] hover:bg-[#c8523a] shadow-sm disabled:opacity-50">{isPending ? 'Salvando...' : 'Salvar Insumo'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
