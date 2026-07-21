'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AtivadorPushPedido } from '@/components/ecommerce/acompanhamento/AtivadorPushPedido';
import {
  type DadosClientePedido,
  type StatusPedido,
  obterDescricaoStatusPedido,
  obterEtapasStatusPedido,
  obterIndiceStatusPedido,
  obterTituloStatusPedido,
  obterTipoEntregaPedido,
} from '@/utils/pedido-status';

interface PedidoAcompanhamento {
  id: string;
  status: StatusPedido;
  valor_total: number;
  forma_pagamento: string;
  created_at: string;
  updated_at: string;
  codigo_acompanhamento: string;
  mercado_pago_payment_id: string | null;
  dados_cliente: DadosClientePedido;
  endereco_entrega: string | null;
  tipo_entrega: 'ENTREGA' | 'RETIRADA';
  restaurante: {
    nome: string;
    slug: string;
    endereco: string | null;
  };
  itens: Array<{
    id: string;
    nome: string;
    imagem_url: string | null;
    quantidade: number;
    preco_unitario: number;
  }>;
}

interface PainelAcompanhamentoPedidoProps {
  pedidoInicial: PedidoAcompanhamento;
  pagamento?: string;
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(data: string) {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PainelAcompanhamentoPedido({ pedidoInicial, pagamento }: PainelAcompanhamentoPedidoProps) {
  const [pedido, setPedido] = useState(pedidoInicial);
  const [erro, setErro] = useState('');
  const tipoEntrega = useMemo(() => obterTipoEntregaPedido(pedido.dados_cliente), [pedido.dados_cliente]);
  const etapas = useMemo(() => obterEtapasStatusPedido(tipoEntrega), [tipoEntrega]);
  const indiceAtual = useMemo(() => obterIndiceStatusPedido(pedido.status), [pedido.status]);

  useEffect(() => {
    let ativo = true;

    const sincronizarPedido = async () => {
      try {
        const resposta = await fetch(`/api/pedidos/acompanhar/${pedido.codigo_acompanhamento}?slug=${pedido.restaurante.slug}`, {
          cache: 'no-store',
        });
        const body = await resposta.json();
        if (!resposta.ok) {
          throw new Error(body?.error || 'Falha ao atualizar pedido.');
        }
        if (ativo) {
          setPedido(body);
          setErro('');
        }
      } catch (error) {
        if (ativo) {
          setErro(error instanceof Error ? error.message : 'Falha ao atualizar pedido.');
        }
      }
    };

    const intervalo = window.setInterval(() => {
      void sincronizarPedido();
    }, 8000);

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, [pedido.codigo_acompanhamento, pedido.restaurante.slug]);

  return (
    <main className="min-h-screen bg-[#F8F8F8] px-4 py-6 text-[#1A1A1A] sm:px-6 md:py-10">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E16349]">Acompanhamento do pedido</span>
              <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900">{pedido.restaurante.nome}</h1>
              <p className="mt-1 text-xs text-zinc-500">Pedido #{pedido.codigo_acompanhamento.slice(0, 8).toUpperCase()}</p>
            </div>
            <Link href={`/${pedido.restaurante.slug}`} className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900">
              Voltar ao cardápio
            </Link>
          </div>

          {pagamento ? (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-xs ${pagamento === 'aprovado' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : pagamento === 'falhou' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              {pagamento === 'aprovado'
                ? 'Pagamento confirmado. Acompanhe as próximas etapas abaixo.'
                : pagamento === 'falhou'
                  ? 'O pagamento não foi concluído. Se necessário, tente novamente com a loja.'
                  : 'Pagamento em análise. Atualizaremos assim que houver confirmação.'}
            </div>
          ) : null}

          <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Status atual</p>
                <h2 className="mt-1 text-lg font-semibold text-zinc-900">
                  {obterTituloStatusPedido(pedido.status, tipoEntrega)}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">{obterDescricaoStatusPedido(pedido.status, tipoEntrega)}</p>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm">
                {pedido.forma_pagamento}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-900">Linha do tempo</h3>
            <span className="text-[11px] text-zinc-400">Atualizado em {formatarData(pedido.updated_at)}</span>
          </div>
          <div className="mt-4 space-y-3">
            {etapas.map((etapa, index) => {
              const concluida = index <= indiceAtual;
              const ativa = etapa.chave === pedido.status;
              return (
                <div key={etapa.chave} className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${concluida ? 'border-emerald-200 bg-emerald-100 text-emerald-700' : 'border-zinc-200 bg-white text-zinc-400'}`}>
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${ativa ? 'text-zinc-900' : 'text-zinc-600'}`}>{etapa.titulo}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{etapa.descricao}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {erro ? <p className="mt-4 text-xs text-red-600">{erro}</p> : null}
        </section>

        <AtivadorPushPedido trackingToken={pedido.codigo_acompanhamento} />

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900">Resumo do pedido</h3>
          <div className="mt-4 space-y-3">
            {pedido.itens.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                {item.imagem_url ? (
                  <Image src={item.imagem_url} alt={item.nome} width={56} height={56} className="h-14 w-14 rounded-xl object-cover" unoptimized />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-xs font-bold text-zinc-400 shadow-inner">
                    {item.nome.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">{item.nome}</p>
                  <p className="mt-1 text-xs text-zinc-500">{item.quantidade}x • {formatarMoeda(item.preco_unitario)}</p>
                </div>
                <div className="text-right text-sm font-semibold text-zinc-900">
                  {formatarMoeda(item.preco_unitario * item.quantidade)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
            <span className="text-sm text-zinc-500">Total</span>
            <span className="text-lg font-semibold text-zinc-900">{formatarMoeda(pedido.valor_total)}</span>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900">Entrega e contato</h3>
          <div className="mt-4 space-y-2 text-sm text-zinc-600">
            <p><span className="font-semibold text-zinc-900">Cliente:</span> {pedido.dados_cliente.nome}</p>
            <p><span className="font-semibold text-zinc-900">WhatsApp:</span> {pedido.dados_cliente.telefone}</p>
            <p><span className="font-semibold text-zinc-900">Tipo:</span> {tipoEntrega === 'RETIRADA' ? 'Retirada na loja' : 'Entrega'}</p>
            {tipoEntrega === 'RETIRADA' ? (
              <p><span className="font-semibold text-zinc-900">Endereço da loja:</span> {pedido.restaurante.endereco || 'Consulte a loja para o endereço de retirada.'}</p>
            ) : (
              <p><span className="font-semibold text-zinc-900">Endereço de entrega:</span> {pedido.endereco_entrega || 'Endereço não informado.'}</p>
            )}
            <p><span className="font-semibold text-zinc-900">Canal extra:</span> Você também receberá atualizações no WhatsApp cadastrado.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
