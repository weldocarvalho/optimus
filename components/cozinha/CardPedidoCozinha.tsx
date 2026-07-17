// components/cozinha/CardPedidoCozinha.tsx
'use client';

import React from 'react';
import { PedidoCozinha } from '@/app/(dashboard)/admin/cozinha/useCozinha';

interface CardPedidoCozinhaProps {
  pedido: PedidoCozinha;
  onAvancarStatus: (pedidoId: string, novoStatus: PedidoCozinha['status']) => void;
  isMutating: boolean;
}

export function CardPedidoCozinha({ pedido, onAvancarStatus, isMutating }: CardPedidoCozinhaProps) {
  const obterProximoStatus = (statusAtual: PedidoCozinha['status']): PedidoCozinha['status'] | null => {
    switch (statusAtual) {
      case 'PENDENTE':
      case 'PAGO':
        return 'PREPARANDO';
      case 'PREPARANDO':
        return 'PRONTO';
      case 'PRONTO':
        return 'ENTREGUE';
      default:
        return null;
    }
  };

  const proximoStatus = obterProximoStatus(pedido.status);

  // TRIAGEM CROMÁTICA RÍGIDA DO DESIGN SYSTEM PARA COMBATER FADIGA VISUAL
  const obterEstiloBotaoAcao = (statusAtual: PedidoCozinha['status']): string => {
    switch (statusAtual) {
      case 'PENDENTE':
      case 'PAGO':
        // Preto Carbono Corporativo - Abertura de ficha técnica
        return 'bg-[#1A1A1A] text-white hover:bg-black';
      case 'PREPARANDO':
        // Coral Terracota Oficial - Concentração máxima na queima/montagem
        return 'bg-[#E16349] text-white hover:bg-[#c9533a]';
      case 'PRONTO':
        // Cinza Estrutural Fosco com Texto Carbono - Transição logística externa
        return 'bg-[#F3F3F3] text-[#1A1A1A] border border-zinc-200/80 hover:bg-zinc-200';
      default:
        return 'bg-zinc-100 text-zinc-400 cursor-not-allowed';
    }
  };

  const obterTextoBotao = (statusAtual: PedidoCozinha['status']): string => {
    switch (statusAtual) {
      case 'PENDENTE':
        return 'Aceitar Pedido';
      case 'PAGO':
        return 'Iniciar Preparo';
      case 'PREPARANDO':
        return 'Concluir Preparo';
      case 'PRONTO':
        return 'Despachar';
      default:
        return 'Finalizado';
    }
  };

  const formatarHora = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-[16px] border border-zinc-200/60 bg-white p-4 text-[#1A1A1A] shadow-sm select-none">
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-400">
            #{pedido.id.substring(0, 8).toUpperCase()}
          </span>
          <span className="text-xs font-bold text-zinc-400">
            {formatarHora(pedido.created_at)}
          </span>
        </div>

        <div className="mb-3 border-b border-zinc-100 pb-2">
          <h3 className="text-xs font-extrabold tracking-tight text-[#1A1A1A] uppercase">{pedido.dados_cliente?.nome}</h3>
          <p className="text-[11px] font-bold text-zinc-400 mt-0.5">{pedido.dados_cliente?.telefone}</p>
        </div>

        <div className="space-y-2">
          {pedido.itens_pedido.map((item) => (
            <div key={item.id} className="flex items-start justify-between text-xs">
              <span className="text-zinc-700 font-semibold leading-tight">
                {item.item_cardapio.nome}
              </span>
              <span className="ml-4 font-mono font-bold text-zinc-500 bg-[#F3F3F3] border border-zinc-200/40 px-1.5 py-0.5 rounded text-[10px]">
                {item.quantidade}x
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-100">
        {proximoStatus ? (
          <button
            onClick={() => onAvancarStatus(pedido.id, proximoStatus)}
            disabled={isMutating}
            className={`w-full rounded-[12px] py-2.5 text-xs font-bold tracking-wide uppercase transition-all duration-150 disabled:opacity-50 shadow-sm ${obterEstiloBotaoAcao(pedido.status)}`}
          >
            {isMutating ? 'Processando...' : obterTextoBotao(pedido.status)}
          </button>
        ) : (
          <div className="w-full rounded-[12px] bg-zinc-100 py-2.5 text-center text-xs font-bold tracking-wide text-zinc-400 uppercase">
            Despachado
          </div>
        )}
      </div>
    </div>
  );
}
