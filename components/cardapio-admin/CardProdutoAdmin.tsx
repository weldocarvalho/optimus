// components/cardapio-admin/CardProdutoAdmin.tsx
'use client';

import { ItemCardapioComCMV } from '@/actions/admin';

interface CardProps {
  produto: ItemCardapioComCMV;
  isSelecionado: boolean;
  onToggleSelect: () => void;
}

export default function CardProdutoAdmin({ produto, isSelecionado, onToggleSelect }: CardProps) {
  const cmvCritico = produto.percentual_cmv > 40;

  return (
    <div className={`border border-transparent rounded-[20px] p-4 flex flex-col lg:flex-row lg:items-start justify-between gap-4 transition-all group ${
      isSelecionado ? 'bg-orange-50/20 border-[#E16349]/20' : 'bg-[#F3F3F3]/30 hover:bg-white hover:border-[#E1E1E1]/40'
    }`}>
      <div className="min-w-0 flex-1 flex items-start gap-3.5">
        <input type="checkbox" checked={isSelecionado} onChange={onToggleSelect} className="w-4 h-4 rounded-md border-zinc-300 text-[#E16349] mt-1 cursor-pointer accent-[#E16349]" />
        
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-[#1A1A1A] group-hover:text-[#E16349] text-sm sm:text-base transition-colors leading-tight truncate">{produto.nome}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wide ${produto.disponivel ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-zinc-50 text-zinc-400 border-zinc-200'}`}>
              {produto.disponivel ? 'Ativo' : 'Pausado'}
            </span>
          </div>
          <p className="text-zinc-400 text-xs truncate max-w-md font-medium mt-1">{produto.descricao || 'Sem descrição.'}</p>
          
          <div className="bg-[#F8F8F8] rounded-xl p-3 space-y-1 border border-zinc-100/50 max-w-md">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Composição:</span>
            {produto.ingredientes.map((ing, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] text-zinc-600 font-medium">
                <span>• {ing.nome}</span>
                <span className="text-zinc-400">{ing.quantidade}{ing.unidade}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:flex sm:items-center gap-4 sm:gap-8 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#F3F3F3] text-zinc-500 font-medium self-center">
        <div className="text-left sm:text-right min-w-[70px]">
          <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider">Custo</span>
          <span className="font-semibold text-zinc-700 text-xs sm:text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.custo_producao)}</span>
        </div>
        <div className="text-left sm:text-right min-w-[65px]">
          <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider">CMV %</span>
          <span className={`font-bold text-xs sm:text-sm ${cmvCritico ? 'text-red-500' : 'text-zinc-700'}`}>{produto.percentual_cmv.toFixed(1)}%</span>
        </div>
        <div className="text-left sm:text-right min-w-[75px]">
          <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider">Margem</span>
          <span className="font-bold text-emerald-600 text-xs sm:text-sm">+{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.margem_lucro)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end shrink-0 self-center sm:pl-4">
        <div className="text-left sm:text-right">
          <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider">Venda</span>
          <span className="font-extrabold text-[#1A1A1A] text-sm sm:text-base">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(produto.preco_venda))}</span>
        </div>
      </div>
    </div>
  );
}
