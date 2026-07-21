// app/[slug]/checkout/page.tsx (Parte 1 de 2)
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCarrinho } from '@/components/ecommerce/ContextoCarrinho';
import AbasEntrega from '@/components/ecommerce/checkout/AbasEntrega';
import CampoCepEntrega from '@/components/ecommerce/checkout/CampoCepEntrega';
import BotaoLocalizacaoGps from '@/components/ecommerce/checkout/BotaoLocalizacaoGps';
import CartaoRetirada from '@/components/ecommerce/checkout/CartaoRetirada';
import FormularioEnderecoEntrega from '@/components/ecommerce/checkout/FormularioEnderecoEntrega';
import type { AbaEntregaCheckout, EtapaCheckout } from '@/components/ecommerce/checkout/tipos';
import { trackInitiateCheckout, trackPurchase } from '@/utils/meta-pixel';

export default function TelaDeCheckoutDedicada() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';
  
  const { itens, adicionarItem, removerItem, valorTotal, totalItens } = useCarrinho();
  
  // Controle de Etapas Sequenciais na Nova Tela
  const [etapaCheckout, setEtapaCheckout] = useState<EtapaCheckout>('SACOLA');
  
  // Estados do Formulário de Entrega Monocromático
  const [abaEntregaAtiva, setAbaEntregaAtiva] = useState<AbaEntregaCheckout>('CEP');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [carregandoPagamento, setCarregandoPagamento] = useState(false);
  const [dadosPix, setDadosPix] = useState<{ qr_code: string; qr_code_base64?: string; payment_id: string } | null>(null);
  const [urlCheckoutCartao, setUrlCheckoutCartao] = useState<string | null>(null);
  const [trackingPedido, setTrackingPedido] = useState<{ tracking_url: string; codigo_acompanhamento: string; pedido_id: string } | null>(null);
  const [enderecoLoja, setEnderecoLoja] = useState('Endereço do estabelecimento');

  useEffect(() => {
    let ativo = true;

    const carregarResumoRestaurante = async () => {
      try {
        const resposta = await fetch(`/api/restaurantes/${slug}/resumo`, { cache: 'no-store' });
        if (!resposta.ok) return;
        const body = await resposta.json();
        if (ativo && typeof body?.endereco === 'string' && body.endereco.trim()) {
          setEnderecoLoja(body.endereco);
        }
      } catch (error) {
        console.error('Erro ao carregar endereço da loja:', error);
      }
    };

    if (slug) {
      void carregarResumoRestaurante();
    }

    return () => {
      ativo = false;
    };
  }, [slug]);

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const dadosEndereco = useMemo(
    () => ({
      rua,
      numero,
      bairro,
      cidade: 'Cidade',
      cep,
    }),
    [bairro, cep, numero, rua]
  );

  const handleVoltarClique = () => {
    if (etapaCheckout === 'PAGAMENTO') {
      setEtapaCheckout('ENTREGA');
    } else if (etapaCheckout === 'ENTREGA') {
      setEtapaCheckout('SACOLA');
    } else {
      router.push(`/${slug}`); // Retorna nativamente para o cardápio correto
    }
  };

  const handleAcaoPrincipal = (e: React.FormEvent) => {
    e.preventDefault();
    if (etapaCheckout === 'SACOLA') {
      if (itens.length === 0) return;
      trackInitiateCheckout({
        itens: itens.map((item) => ({ id: item.produto.id, quantidade: item.quantidade })),
        valorTotal,
      });
      setEtapaCheckout('ENTREGA');
    } else if (etapaCheckout === 'ENTREGA') {
      setEtapaCheckout('PAGAMENTO');
    }
  };

  const criarPagamento = async (novoMetodo: 'PIX' | 'CARTAO') => {
    setCarregandoPagamento(true);
    setDadosPix(null);
    setUrlCheckoutCartao(null);
    setTrackingPedido(null);

    try {
      const resposta = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug,
          paymentMethod: novoMetodo,
          itens: itens.map((item) => ({
            item_cardapio_id: item.produto.id,
            quantidade: item.quantidade,
          })),
          dadosCliente: {
            nome: nomeCliente,
            telefone: telefoneCliente,
            email: emailCliente,
            tipoEntrega: abaEntregaAtiva === 'RETIRADA' ? 'RETIRADA' : 'ENTREGA',
            endereco: abaEntregaAtiva === 'RETIRADA' ? undefined : dadosEndereco,
          },
        }),
      });

      const body = await resposta.json();
      if (!resposta.ok) {
        throw new Error(body?.error || 'Falha ao iniciar pagamento.');
      }

      if (body.tracking_url && body.codigo_acompanhamento && body.pedido_id) {
        setTrackingPedido({
          tracking_url: body.tracking_url,
          codigo_acompanhamento: body.codigo_acompanhamento,
          pedido_id: body.pedido_id,
        });
      }

      if (body.pedido_id) {
        trackPurchase({
          pedidoId: body.pedido_id,
          valorTotal,
          itens: itens.map((item) => ({ id: item.produto.id, quantidade: item.quantidade })),
        });
      }

      if (novoMetodo === 'PIX') {
        setDadosPix({
          qr_code: body.qr_code,
          qr_code_base64: body.qr_code_base64,
          payment_id: body.payment_id,
        });
      } else if (body.checkout_url) {
        setUrlCheckoutCartao(body.checkout_url);
        window.location.href = body.checkout_url;
      }
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Falha ao iniciar pagamento.');
    } finally {
      setCarregandoPagamento(false);
    }
  };

  const handleCapturarGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const resposta = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
            const dados = await resposta.json();
            if (dados.address) {
              setRua(dados.address.road || '');
              setBairro(dados.address.suburb || dados.address.neighbourhood || '');
              setTimeout(() => {
                document.getElementById('input-numero')?.focus();
              }, 100);
            }
          } catch (error) {
            console.error('Erro ao processar mapa:', error);
          }
        },
        (error) => console.error(error)
      );
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#F8F8F8] text-[#1A1A1A] font-sans antialiased flex flex-col justify-between selection:bg-zinc-900 selection:text-white">
      
      {/* Área de Conteúdo Superior */}
      <div className="w-full max-w-xl mx-auto bg-white flex-1 flex flex-col shadow-sm border-x border-zinc-200/40">
        
        {/* Topbar da Nova Tela Separada */}
        <header className="p-6 border-b border-zinc-100 flex items-center gap-4 bg-white sticky top-0 z-10 shrink-0">
          <button 
            type="button" 
            onClick={handleVoltarClique}
            className="w-9 h-9 rounded-xl bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-800 transition-colors border border-zinc-200/40"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-zinc-900">
              {etapaCheckout === 'SACOLA'
                ? 'Revisar Sacola'
                : etapaCheckout === 'ENTREGA'
                  ? 'Finalizar Pedido'
                  : 'Pagamento'}
            </h1>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
              {etapaCheckout === 'SACOLA'
                ? `Etapa 1 de 3 • ${totalItens} itens`
                : etapaCheckout === 'ENTREGA'
                  ? 'Etapa 2 de 3 • Dados de entrega'
                  : 'Etapa 3 de 3 • PIX ou Cartão'}
            </p>
          </div>
        </header>

        {/* Scroll Central da Rota */}
        <div className="p-6 space-y-6 flex-1 bg-white">
          
          {/* RENDERIZAÇÃO DA SACOLA EM NOVA TELA */}
          {etapaCheckout === 'SACOLA' && (
            <div className="space-y-4">
              {itens.length === 0 ? (
                <div className="text-center py-20 text-zinc-400 italic text-xs font-medium bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 p-4">
                  Sua sacola está limpa. Adicione itens para prosseguir ao pagamento.
                  <Link href={`/${slug}`} className="block mt-4 text-xs font-extrabold uppercase tracking-wider text-zinc-900 underline">Voltar à Loja</Link>
                </div>
              ) : (
                itens.map((item) => (
                  <div 
                    key={item.idUnico} 
                    className="bg-white border border-zinc-200/60 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm"
                  >
                    {item.produto.imagem_url ? (
                      <Image
                        src={item.produto.imagem_url}
                        alt={item.produto.nome}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-xl border border-zinc-200/60 object-cover shadow-inner"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200/60 flex items-center justify-center text-xs font-extrabold text-zinc-400 font-mono shrink-0 shadow-inner">
                        {item.produto.nome.substring(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-zinc-900 text-xs sm:text-sm truncate leading-tight">
                        {item.produto.nome}
                      </h4>
                      <span className="text-xs font-extrabold text-zinc-500 font-mono block mt-1">
                        {formatarMoeda(Number(item.produto.preco_venda) * item.quantidade)}
                      </span>
                    </div>

                    <div className="flex items-center bg-zinc-50 rounded-xl p-1 gap-2 border border-zinc-200/40 shrink-0 select-none">
                      <button 
                        type="button"
                        onClick={() => removerItem(item.idUnico)} 
                        className="w-6 h-6 rounded-lg bg-white border border-zinc-200/40 flex items-center justify-center text-xs font-extrabold text-zinc-600 hover:bg-zinc-100 shadow-sm transition-colors"
                      >
                        -
                      </button>
                      <span className="text-xs font-extrabold px-1.5 text-zinc-900 font-mono">{item.quantidade}</span>
                      <button 
                        type="button"
                        onClick={() => adicionarItem(item.produto, item.adicionaisEscolhidos)} 
                        className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-xs font-extrabold text-white shadow-sm transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {etapaCheckout === 'ENTREGA' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Card de Resumo de Itens Selecionados */}
              <div className="bg-zinc-50 border border-zinc-200/60 rounded-xl p-4 flex justify-between items-center text-xs font-medium">
                <span className="text-zinc-500">Resumo da Compra</span>
                <span className="font-bold text-zinc-900">{totalItens} {totalItens === 1 ? 'item' : 'itens'} na sacola</span>
              </div>

              {/* Seletor de Tipo de Entrega Monocromático */}
              <div className="bg-white border border-zinc-200/60 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <AbasEntrega
                  abaAtiva={abaEntregaAtiva}
                  onChangeAba={setAbaEntregaAtiva}
                  classeCorTextoAtiva="text-zinc-900"
                />
                
                <div className="p-4 space-y-4">
                  {abaEntregaAtiva === 'CEP' && <CampoCepEntrega cep={cep} onChangeCep={setCep} abaAtiva={abaEntregaAtiva} />}
                  {abaEntregaAtiva === 'GPS' && <BotaoLocalizacaoGps onCapturarLocalizacao={handleCapturarGps} />}
                  {abaEntregaAtiva === 'RETIRADA' && <CartaoRetirada endereco={enderecoLoja} />}

                  {abaEntregaAtiva !== 'RETIRADA' && (
                    <FormularioEnderecoEntrega
                      rua={rua}
                      onChangeRua={setRua}
                      numero={numero}
                      onChangeNumero={setNumero}
                      bairro={bairro}
                      onChangeBairro={setBairro}
                    />
                  )}
                </div>
              </div>

              {/* Informações de Contato Obrigatórias (Estilo Carteira iOS) */}
              <div className="bg-white border border-zinc-200/60 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Nome Completo</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: João Silva" 
                    value={nomeCliente} 
                    onChange={(e) => setNomeCliente(e.target.value)}
                    className="w-full bg-zinc-50/50 border border-zinc-200/60 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:bg-white focus:border-zinc-400 transition-all text-zinc-900 placeholder-zinc-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">WhatsApp para Notificações</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="(00) 99999-9999" 
                    value={telefoneCliente} 
                    onChange={(e) => setTelefoneCliente(e.target.value)}
                    className="w-full bg-zinc-50/50 border border-zinc-200/60 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:bg-white focus:border-zinc-400 transition-all text-zinc-900 placeholder-zinc-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">E-mail para pagamento</label>
                  <input
                    type="email"
                    placeholder="cliente@exemplo.com"
                    value={emailCliente}
                    onChange={(e) => setEmailCliente(e.target.value)}
                    className="w-full bg-zinc-50/50 border border-zinc-200/60 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:bg-white focus:border-zinc-400 transition-all text-zinc-900 placeholder-zinc-400"
                  />
                </div>
              </div>
            </div>
          )}
          {etapaCheckout === 'PAGAMENTO' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-zinc-50 border border-zinc-200/60 rounded-xl p-4 flex justify-between items-center text-xs font-medium">
                <span className="text-zinc-500">Resumo da Compra</span>
                <span className="font-bold text-zinc-900">{formatarMoeda(valorTotal)}</span>
              </div>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => criarPagamento('PIX')}
                  disabled={carregandoPagamento}
                  className="rounded-2xl border border-[#E9B31E] bg-[#FFC72C] px-4 py-4 text-left text-zinc-900 shadow-sm disabled:opacity-50"
                >
                  <div className="text-xs font-bold uppercase tracking-widest">PIX</div>
                  <div className="text-sm font-medium">Pagar com QR Code e copia e cola</div>
                </button>

                <button
                  type="button"
                  onClick={() => criarPagamento('CARTAO')}
                  disabled={carregandoPagamento}
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-left text-zinc-900 shadow-sm disabled:opacity-50"
                >
                  <div className="text-xs font-bold uppercase tracking-widest">Cartão de crédito</div>
                  <div className="text-sm font-medium">Finalizar no checkout do Mercado Pago</div>
                </button>
              </div>

              {dadosPix && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
                  <div className="text-sm font-semibold text-zinc-800">Seu PIX foi gerado</div>
                  {dadosPix.qr_code_base64 && (
                    <Image
                      src={`data:image/png;base64,${dadosPix.qr_code_base64}`}
                      alt="QR Code PIX"
                      width={224}
                      height={224}
                      unoptimized
                      className="mx-auto h-56 w-56 object-contain"
                    />
                  )}
                  <textarea
                    readOnly
                    value={dadosPix.qr_code}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-[11px] font-mono text-zinc-700"
                    rows={4}
                  />
                  {trackingPedido ? (
                    <Link
                      href={trackingPedido.tracking_url}
                      className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-zinc-800"
                    >
                      Acompanhar pedido
                    </Link>
                  ) : null}
                </div>
              )}

              {urlCheckoutCartao && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
                  Redirecionando para pagamento com cartão...
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Rodapé de Fechamento de Conta de Alta Performance Financeira */}
        <footer className="p-6 border-t border-zinc-100 bg-white space-y-4 shrink-0 select-none w-full max-w-xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">Subtotal Líquido</span>
              <span className="text-xl font-extrabold text-zinc-900 font-mono tracking-tight">
                {formatarMoeda(valorTotal)}
              </span>
            </div>
            {etapaCheckout !== 'PAGAMENTO' && itens.length > 0 && (
              <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200/40">
                Itens revisados
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAcaoPrincipal}
            disabled={itens.length === 0}
            className="w-full py-4 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs uppercase tracking-wider transition-all duration-200 active:scale-[0.99] shadow-sm disabled:opacity-30 disabled:pointer-events-none"
          >
            {etapaCheckout === 'SACOLA'
              ? 'Avançar para Entrega'
              : etapaCheckout === 'ENTREGA'
                ? 'Ir para o Pagamento'
                : carregandoPagamento
                  ? 'Processando...'
                  : 'Escolher pagamento'}
          </button>
        </footer>

      </div>
    </main>
  );
}
