// components/insumos-admin/CardInsumoAdmin.tsx
'use client';

import { Insumo } from '@/types/database';

interface CardProps {
  insumo: Insumo;
  isSelecionado: boolean;
  onToggleSelect: () => void;
  onEditarClick: (insumo: Insumo) => void; // Nova propriedade de clique
}

export default function CardInsumoAdmin({ insumo, isSelecionado, onToggleSelect, onEditarClick }: CardProps) {
  const estoqueCritico = Number(insumo.estoque_atual) <= Number(insumo.estoque_minimo);

  return (
    <div className={`border border-transparent rounded-[20px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group ${
      isSelecionado ? 'bg-orange-50/20 border-[#E16349]/20' : 'bg-[#F3F3F3]/30 hover:bg-white hover:border-[#E1E1E1]/40'
    }`}>
      {/* Checkbox + Nome do Insumo */}
      <div className="min-w-0 flex-1 flex items-center gap-3.5">
        <input 
          type="checkbox" 
          checked={isSelecionado} 
          onChange={onToggleSelect} 
          className="w-4 h-4 rounded-md border-zinc-300 text-[#E16349] cursor-pointer accent-[#E16349]" 
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[#1A1A1A] text-sm sm:text-base leading-tight truncate">
            {insumo.nome}
          </h3>
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mt-1">
            Unidade: {insumo.unidade_medida}
          </span>
        </div>
      </div>

      {/* Dados Operacionais e Ação de Edição */}
      <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10 text-zinc-500 font-medium shrink-0">
        <div className="grid grid-cols-3 sm:flex sm:items-center gap-4 sm:gap-10">
          {/* Custo unitário */}
          <div className="text-left sm:text-right min-w-[70px]">
            <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider">Custo Unit.</span>
            <span className="font-semibold text-zinc-700 text-xs sm:text-sm">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 4 }).format(insumo.custo_unitario)}
            </span>
          </div>

          {/* Estoque atual */}
          <div className="text-left sm:text-right min-w-[65px]">
            <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider">Estoque</span>
            <span className={`font-bold text-xs sm:text-sm ${estoqueCritico ? 'text-red-500 font-extrabold' : 'text-zinc-700'}`}>
              {insumo.estoque_atual}{insumo.unidade_medida}
            </span>
          </div>

          {/* Mínimo */}
          <div className="text-left sm:text-right min-w-[65px]">
            <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider">Mínimo</span>
            <span className="font-medium text-zinc-400 text-xs sm:text-sm">
              {insumo.estoque_minimo}{insumo.unidade_medida}
            </span>
          </div>
        </div>

        {/* BOTÃO INDIVIDUAL DE EDITAR: Visual iOS limpo e minimalista */}
        <button
          type="button"
          onClick={() => onEditarClick(insumo)}
          className="text-xs font-bold px-3 py-1.5 rounded-[12px] bg-white text-zinc-500 border border-zinc-200 hover:text-[#1A1A1A] hover:border-zinc-300 transition-all shadow-sm"
        >
          Editar
        </button>
      </div>
    </div>
  );
}
