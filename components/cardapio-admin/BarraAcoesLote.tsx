// components/cardapio-admin/BarraAcoesLote.tsx
'use client';

interface BarraAcoesProps {
  todosSelecionados: boolean;
  onSelecionarTodos: () => void;
  qtdSelecionados: number;
  onAlterarStatus: (disponivel: boolean) => void;
  isPending: boolean;
}

export default function BarraAcoesLote({ todosSelecionados, onSelecionarTodos, qtdSelecionados, onAlterarStatus, isPending }: BarraAcoesProps) {
  return (
    <div className="px-6 py-4 bg-[#F8F8F8]/60 border-b border-[#F3F3F3] flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <input 
          type="checkbox" 
          checked={todosSelecionados}
          onChange={onSelecionarTodos}
          className="w-4 h-4 rounded-md border-zinc-300 text-[#E16349] focus:ring-[#E16349] cursor-pointer accent-[#E16349]"
        />
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          {qtdSelecionados > 0 ? `${qtdSelecionados} selecionados` : 'Selecionar Todos'}
        </span>
      </div>

      <div className={`flex items-center gap-2 transition-all ${qtdSelecionados > 0 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
        <button onClick={() => onAlterarStatus(true)} disabled={isPending} className="px-3 py-1.5 bg-zinc-950 text-white font-bold text-[11px] rounded-lg hover:bg-zinc-800">
          Ativar Selecionados
        </button>
        <button onClick={() => onAlterarStatus(false)} disabled={isPending} className="px-3 py-1.5 bg-white text-zinc-500 border border-zinc-200 font-bold text-[11px] rounded-lg hover:text-zinc-800 hover:border-zinc-300">
          Pausar Selecionados
        </button>
      </div>
    </div>
  );
}
