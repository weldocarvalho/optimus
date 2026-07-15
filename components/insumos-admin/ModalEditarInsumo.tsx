// components/insumos-admin/ModalEditarInsumo.tsx
'use client';

import type { FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Insumo } from '@/types/database';

interface EditarProps {
  insumo: Insumo | null;
  onFechar: () => void;
  onSalvar: (id: string, custo: number, estoque: number, minimo: number) => void;
  isPending: boolean;
}

export default function ModalEditarInsumo({ insumo, onFechar, onSalvar, isPending }: EditarProps) {
  if (!insumo || typeof document === 'undefined') return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const custo = Number(formData.get('custo'));
    const estoque = Number(formData.get('estoque'));
    const minimo = Number(formData.get('minimo'));

    onSalvar(insumo.id, custo, estoque, minimo);
  };

  return createPortal(
    <div className="fixed inset-0 bg-zinc-950/20 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[28px] border border-zinc-100 shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        
        <div className="p-6 border-b border-[#F3F3F3] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold tracking-tight text-[#1A1A1A]">Editar {insumo.nome}</h2>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">Atualização de Custos</p>
          </div>
          <button type="button" onClick={onFechar} className="w-6 h-6 bg-[#F3F3F3] hover:bg-zinc-200 text-zinc-500 rounded-full flex items-center justify-center text-[10px] font-bold">✕</button>
        </div>

        <form key={insumo.id} onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Novo Custo Unitário (R$ por {insumo.unidade_medida})</label>
            <input name="custo" type="number" step="0.0001" required defaultValue={insumo.custo_unitario} className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#E16349] focus:ring-1 focus:ring-[#E16349]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Estoque Atual</label>
              <input name="estoque" type="number" step="0.01" required defaultValue={insumo.estoque_atual} className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#E16349]" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Alerta Mínimo</label>
              <input name="minimo" type="number" step="0.01" required defaultValue={insumo.estoque_minimo} className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#E16349]" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onFechar} className="flex-1 py-2.5 bg-[#F3F3F3] text-zinc-500 font-bold text-xs rounded-[14px] hover:bg-zinc-200">Cancelar</button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-[#E16349] text-white font-bold text-xs rounded-[14px] hover:bg-[#c8523a] shadow-sm disabled:opacity-50">{isPending ? 'Atualizando...' : 'Atualizar Insumo'}</button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}
