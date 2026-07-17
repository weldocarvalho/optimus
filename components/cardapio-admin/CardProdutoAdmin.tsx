// components/cardapio-admin/CardProdutoAdmin.tsx
'use client';

import { ItemCardapioComCMV } from '@/actions/admin';

interface CardProps {
  produto: ItemCardapioComCMV;
  isSelecionado: boolean;
  onToggleSelect: () => void;
  onAlternarStatus: () => void;
  onExcluir: () => void;
  isPending?: boolean;
}

export default function CardProdutoAdmin({
  produto,
  isSelecionado,
  onToggleSelect,
  onAlternarStatus,
  onExcluir,
  isPending = false,
}: CardProps) {
  const cmvCritico = produto.percentual_cmv > 40;

  return (
    <div className={`group flex flex-col gap-4 rounded-2xl border p-4 transition-all lg:flex-row lg:items-start lg:justify-between ${
      isSelecionado ? 'border-[#E16349]/25 bg-orange-50/30' : 'border-zinc-200/50 bg-zinc-50/40 hover:border-zinc-300 hover:bg-white'
    }`}>
      <div className="min-w-0 flex-1 flex items-start gap-3.5">
        <input type="checkbox" checked={isSelecionado} onChange={onToggleSelect} className="w-4 h-4 rounded-md border-zinc-300 text-[#E16349] mt-1 cursor-pointer accent-[#E16349]" />
        
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="truncate text-sm font-semibold leading-tight text-[#1A1A1A] transition-colors group-hover:text-[#E16349] sm:text-base">{produto.nome}</h3>
            <button
              type="button"
              onClick={onAlternarStatus}
              disabled={isPending}
              className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide transition disabled:opacity-60 ${
                produto.disponivel
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100'
              }`}
            >
              {produto.disponivel ? 'Ativo' : 'Pausado'}
            </button>
            <button
              type="button"
              onClick={onExcluir}
              disabled={isPending}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-60"
              aria-label={`Apagar ${produto.nome}`}
              title="Apagar item"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2m-7 4v8m6-8v8M5 6l1 14h12l1-14" />
              </svg>
            </button>
          </div>
          <p className="mt-1 max-w-md truncate text-xs font-medium text-zinc-500">{produto.descricao || 'Sem descrição.'}</p>
          
          <div className="max-w-md space-y-1 rounded-xl border border-zinc-200/70 bg-white p-3">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Composição</span>
            {produto.ingredientes.map((ing, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] font-medium text-zinc-600">
                <span>• {ing.nome}</span>
                <span className="text-zinc-400">{ing.quantidade}{ing.unidade}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 self-center border-t border-zinc-200 pt-3 text-zinc-500 sm:flex sm:items-center sm:gap-8 lg:border-t-0 lg:pt-0">
        <div className="text-left sm:text-right min-w-[70px]">
          <span className="block text-[9px] font-semibold uppercase tracking-wider text-zinc-400">Custo</span>
          <span className="text-xs font-semibold text-zinc-700 sm:text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.custo_producao)}</span>
        </div>
        <div className="text-left sm:text-right min-w-[65px]">
          <span className="block text-[9px] font-semibold uppercase tracking-wider text-zinc-400">CMV %</span>
          <span className={`text-xs font-semibold sm:text-sm ${cmvCritico ? 'text-red-500' : 'text-zinc-700'}`}>{produto.percentual_cmv.toFixed(1)}%</span>
        </div>
        <div className="text-left sm:text-right min-w-[75px]">
          <span className="block text-[9px] font-semibold uppercase tracking-wider text-zinc-400">Margem</span>
          <span className="text-xs font-semibold text-emerald-600 sm:text-sm">+{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.margem_lucro)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end shrink-0 self-center sm:pl-4">
        <div className="text-left sm:text-right">
          <span className="block text-[9px] font-semibold uppercase tracking-wider text-zinc-400">Venda</span>
          <span className="text-sm font-bold text-[#1A1A1A] sm:text-base">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(produto.preco_venda))}</span>
        </div>
      </div>
    </div>
  );
}
