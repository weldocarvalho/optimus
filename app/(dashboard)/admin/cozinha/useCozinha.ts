// app/(dashboard)/admin/cozinha/useCozinha.ts
'use client';

import { useState, useEffect, useTransition } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

export interface ItemPedidoDetalhado {
  id: string;
  quantidade: number;
  item_cardapio: { nome: string };
}

export interface PedidoCozinha {
  id: string;
  status: 'PENDENTE' | 'PAGO' | 'PREPARANDO' | 'PRONTO' | 'ENTREGUE';
  valor_total: number;
  forma_pagamento: string;
  dados_cliente: {
    nome: string;
    telefone: string;
    endereco?: { rua: string; numero: string; bairro: string };
  };
  created_at: string;
  itens_pedido: ItemPedidoDetalhado[];
}

export function useCozinha() {
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
      console.error('Falha ao emitir áudio nativo:', err);
    }
  };

  

  const buscarItensDoPedido = async (pedidoId: string) => {
    console.log('CHAMOU A FUNCAO buscarItensDoPedido', pedidoId);

    const { data: itensBuscados } = await supabaseClient
      .from('itens_pedido')
      .select('id, quantidade, itens_cardapio ( nome )')
      .eq('pedido_id', pedidoId);

    const itensFormatados = (itensBuscados || []).map((i: any) => ({
      id: i.id,
      quantidade: i.quantidade,
      item_cardapio: { nome: i.itens_cardapio?.nome || 'Item Desconhecido' }
    }));

    console.log('ITENS DO PEDIDO', pedidoId, itensFormatados);

    return itensFormatados;
  };

  const buscarPedidosAtivosDoBanco = async (idDoRestaurante: string): Promise<PedidoCozinha[]> => {
    console.log('CHAMOU A FUNCAO buscarPedidosAtivosDoBanco', idDoRestaurante);
    
    const { data: listaPedidos } = await supabaseClient
      .from('pedidos')
      .select(`
        id, status, valor_total, forma_pagamento, dados_cliente, created_at,
        itens_pedido ( id, quantidade, itens_cardapio ( nome ) )
      `)
      .eq('restaurante_id', idDoRestaurante)
      .in('status', ['PENDENTE', 'PAGO', 'PREPARANDO', 'PRONTO'])
      .order('created_at', { ascending: true });

      console.log('LISTA DE PEDIDOS NA FUNCAO buscarPedidosAtivosDoBanco:', listaPedidos);

    return (listaPedidos || []).map((p: any) => ({
      id: p.id,
      status: p.status,
      valor_total: p.valor_total,
      forma_pagamento: p.forma_pagamento,
      dados_cliente: p.dados_cliente,
      created_at: p.created_at,
      itens_pedido: (p.itens_pedido || []).map((i: any) => ({
        id: i.id,
        quantidade: i.quantidade,
        item_cardapio: { nome: i.itens_cardapio?.nome || 'Item Desconhecido' }
      }))
    })) as PedidoCozinha[];
  };

  useEffect(() => {
    async function carregarDadosIniciais() {
      const { data: rest } = await supabaseClient.from('restaurantes').select('id').limit(1).single();
      console.log('RESTAURANTE ENCONTRADO:', rest);

      if (rest) {
        setRestauranteId(rest.id);

        console.log('RESTAURANTE ID:', rest.id);

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

        const adicionarPedidoNaFila = async (registro: any) => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          const itensFormatados = await buscarItensDoPedido(registro.id);
          const pedidoCompleto: PedidoCozinha = {
            id: registro.id, status: registro.status, valor_total: registro.valor_total,
            forma_pagamento: registro.forma_pagamento, dados_cliente: registro.dados_cliente,
            created_at: registro.created_at, itens_pedido: itensFormatados
          };
          setPedidos((prev) => prev.some(p => p.id === pedidoCompleto.id) ? prev : [...prev, pedidoCompleto]);
          dispararAlertaSonoro();
        };

        if (eventType === 'INSERT' && ['PENDENTE', 'PAGO', 'PREPARANDO', 'PRONTO'].includes(novoRegistro.status)) {
          await adicionarPedidoNaFila(novoRegistro);
        }

        if (eventType === 'UPDATE') {
          if (novoRegistro.status === 'ENTREGUE') {
            setPedidos((prev) => prev.filter((p) => p.id !== novoRegistro.id));
          } else {
            setPedidos((prev) => {
              const existe = prev.some((p) => p.id === novoRegistro.id);
              if (!existe && (novoRegistro.status === 'PAGO' || novoRegistro.status === 'PREPARANDO')) {
                adicionarPedidoNaFila(novoRegistro);
                return prev;
              }
              return prev.map((p) => (p.id === novoRegistro.id ? { ...p, status: novoRegistro.status } : p));
            });
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

  return { pedidos, loading, sincronizando, isPending, executarReconciliacaoPedidos, alterarStatusPedido };
}
