// app/(dashboard)/admin/cozinha/page.tsx
'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { BarraNavegacaoCozinha } from '@/components/cozinha/BarraNavegacaoCozinha';
import { ColunaEsteiraCozinha } from '@/components/cozinha/ColunaEsteiraCozinha';

export interface ItemPedidoDetalhado {
  id: string;
  quantidade: number;
  item_cardapio: {
    nome: string;
  };
}

export interface PedidoCozinha {
  id: string;
  status: 'PENDENTE' | 'PAGO' | 'PREPARANDO' | 'PRONTO' | 'ENTREGUE';
  valor_total: number;
  forma_pagamento: string;
  dados_cliente: {
    nome: string;
    telefone: string;
    endereco?: {
      rua: string;
      numero: string;
      bairro: string;
    };
  };
  created_at: string;
  itens_pedido: ItemPedidoDetalhado[];
}

export default function PainelCozinhaAdmin() {
  const [pedidos, setPedidos] = useState<PedidoCozinha[]>([]);
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [restauranteId, setRestauranteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dispararAlertaSonoro = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (err) {
      console.error(err);
    }
  };

  const buscarItensDoPedido = async (pedidoId: string) => {
    const { data: itensBuscados } = await supabaseClient
      .from('itens_pedido')
      .select('id, quantidade, itens_cardapio ( nome )')
      .eq('pedido_id', pedidoId);

    return (itensBuscados || []).map((i: any) => ({
      id: i.id,
      quantidade: i.quantidade,
      item_cardapio: { nome: i.itens_cardapio?.nome || 'Item Desconhecido' }
    }));
  };

  const buscarPedidosAtivosDoBanco = async (idDoRestaurante: string): Promise<PedidoCozinha[]> => {
    const { data: listaPedidos } = await supabaseClient
      .from('pedidos')
      .select(`
        id, status, valor_total, forma_pagamento, dados_cliente, created_at,
        itens_pedido (
          id, quantity:quantidade,
          itens_cardapio ( nome )
        )
      `)
      .eq('restaurante_id', idDoRestaurante)
      .in('status', ['PENDENTE', 'PAGO', 'PREPARANDO', 'PRONTO'])
      .order('created_at', { ascending: true });

    return (listaPedidos || []).map((p: any) => ({
      id: p.id,
      status: p.status,
      valor_total: p.valor_total,
      forma_pagamento: p.forma_pagamento,
      dados_cliente: p.dados_cliente,
      created_at: p.created_at,
      itens_pedido: (p.itens_pedido || []).map((i: any) => ({
        id: i.id,
        quantidade: i.quantity,
        item_cardapio: { nome: i.itens_cardapio?.nome || 'Item Desconhecido' }
      }))
    })) as PedidoCozinha[];
  };

  useEffect(() => {
    async function carregarDadosIniciais() {
      const { data: rest } = await supabaseClient.from('restaurantes').select('id').limit(1).single();
      if (rest) {
        setRestauranteId(rest.id);
        const pedidosIniciais = await buscarPedidosAtivosDoBanco(rest.id);
        setPedidos(pedidosIniciais);
      }
      setLoading(false);
    }
    carregarDadosIniciais();
  }, []);

  useEffect(() => {
    if (!restauranteId) return;
    const canalCozinha = supabaseClient
      .channel('cozinha_realtime_master')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, async (payload) => {
        const { eventType, new: novoRegistroRaw } = payload;
        const novoRegistro = novoRegistroRaw as any;
        if (!novoRegistro || novoRegistro.restaurante_id !== restauranteId) return;

        if (eventType === 'INSERT') {
          await new Promise((resolve) => setTimeout(resolve, 500));
          const itensFormatados = await buscarItensDoPedido(novoRegistro.id);
          const pedidoCompleto: PedidoCozinha = {
            id: novoRegistro.id, status: novoRegistro.status, valor_total: novoRegistro.valor_total,
            forma_pagamento: novoRegistro.forma_pagamento, dados_cliente: novoRegistro.dados_cliente,
            created_at: novoRegistro.created_at, itens_pedido: itensFormatados
          };
          setPedidos((prev) => prev.some(p => p.id === pedidoCompleto.id) ? prev : [...prev, pedidoCompleto]);
          dispararAlertaSonoro();
        }

        if (eventType === 'UPDATE') {
          if (novoRegistro.status === 'ENTREGUE') {
            setPedidos((prev) => prev.filter((p) => p.id !== novoRegistro.id));
          } else {
            setPedidos((prev) => prev.map((p) => (p.id === novoRegistro.id ? { ...p, status: novoRegistro.status } : p)));
          }
        }
      })
      .subscribe();
    return () => { supabaseClient.removeChannel(canalCozinha); };
  }, [restauranteId]);

  const executarReconciliacaoPedidos = async () => {
    if (!restauranteId || sincronizando) return;
    setSincronizando(true);
    try {
      const pedidosBanco = await buscarPedidosAtivosDoBanco(restauranteId);
      const idsNaTela = pedidos.map(p => p.id);
      const pedidosRepresados = pedidosBanco.filter(p => !idsNaTela.includes(p.id));
      if (pedidosRepresados.length > 0) {
        setPedidos((prev) => [...prev, ...pedidosRepresados].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
        dispararAlertaSonoro();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSincronizando(false);
    }
  };

  const alterarStatusPedido = (pedidoId: string, novoStatus: PedidoCozinha['status']) => {
    startTransition(async () => {
      await supabaseClient.from('pedidos').update({ status: novoStatus }).eq('id', pedidoId);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E16349] border-t-transparent" />
      </div>
    );
  }

  const pedidosNovos = pedidos.filter(p => p.status === 'PENDENTE' || p.status === 'PAGO');
  const pedidosPreparo = pedidos.filter(p => p.status === 'PREPARANDO');
  const pedidosProntos = pedidos.filter(p => p.status === 'PRONTO');

  return (
    <div className="min-h-screen bg-[#F3F3F3] text-[#1A1A1A] font-sans antialiased flex items-start justify-center p-4 sm:p-8 md:py-12">
      <div className="w-full max-w-4xl space-y-6">
        
        <BarraNavegacaoCozinha />

        {/* HEADER DE SUB-TELA REESTRUTURADO OPERACIONAL */}
        <header className="flex items-center justify-between px-2 select-none">
          <div className="leading-tight">
            <h1 className="text-xl font-black tracking-tight text-[#1A1A1A]">Monitor de Produção</h1>
            <span className="text-[11px] font-bold text-zinc-400 block mt-0.5">Fila de pedidos ativa em tempo real</span>
          </div>

          <div className="flex items-center gap-3">
            {/* O NOVO BOTAO RECONCILIAR - MINIMALISTA, TOTALMENTE INTEGRADO À TELA DA COZINHA */}
            <button
              onClick={executarReconciliacaoPedidos}
              disabled={sincronizando}
              className="rounded-[12px] border border-zinc-200/80 bg-white px-3.5 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition-all duration-150 hover:bg-zinc-50 disabled:opacity-50 shadow-sm"
            >
              {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
            </button>
            
            <div className="flex items-center gap-2 bg-white border border-zinc-200/60 px-3 py-2 rounded-[12px] shadow-sm">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Canal Ativo</span>
            </div>
          </div>
        </header>

        {/* GRID DE COLUNAS OPERACIONAIS */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <ColunaEsteiraCozinha titulo="Entrada / Pagos" pedidos={pedidosNovos} onAvancarStatus={alterarStatusPedido} isMutating={isPending} />
          <ColunaEsteiraCozinha titulo="Em Preparo" pedidos={pedidosPreparo} onAvancarStatus={alterarStatusPedido} isMutating={isPending} />
          <ColunaEsteiraCozinha titulo="Pronto para Envio" pedidos={pedidosProntos} onAvancarStatus={alterarStatusPedido} isMutating={isPending} />
        </div>

      </div>
    </div>
  );
}
