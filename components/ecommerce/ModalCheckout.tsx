// components/ecommerce/ModalCheckout.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCarrinho } from './ContextoCarrinho';

interface CheckoutProps {
  aberto: boolean;
  onFechar: () => void;
  slug: string;
  ehAcai: boolean;
}

export default function ModalCheckout({ aberto, onFechar, slug, ehAcai }: CheckoutProps) {
  const { itens, valorTotal } = useCarrinho();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  // Estados do Formulário de Entrega
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!aberto || !mounted || itens.length === 0) return null;

  // PIPELINE DE DISPARO DA STRIPE REAL
  const handleRedirecionarStripe = (e: React.FormEvent) => {
    e.preventDefault();

    const dadosCliente = {
      nome,
      telefone,
      endereco: { rua, numero, bairro, cidade: 'Brasília', cep: '72000-000' }
    };

    const itensMapeados = itens.map(i => ({
      item_cardapio_id: i.produto.id,
      quantidade: i.quantidade,
      preco_unitario: Number(i.produto.preco_venda)
    }));

    startTransition(async () => {
      try {
        // Envia o carrinho para a nossa rota de API backend
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug,
            dadosCliente,
            itens: itensMapeados
          })
        });

        const dados = await response.json();

        if (dados.url) {
          // Redireciona o cliente final diretamente para o Checkout Oficial da Stripe
          window.location.href = dados.url;
        } else {
          alert(`❌ Erro no checkout: ${dados.error || 'Falha ao gerar link.'}`);
        }
      } catch (error) {
        console.error('Erro ao conectar com a API de checkout:', error);
        alert('❌ Falha na conexão com o servidor de pagamentos.');
      }
    });
  };

  const corTema = ehAcai ? 'bg-[#3B0D2C] hover:bg-[#2C0A25]' : 'bg-[#E16349] hover:bg-[#c8523a]';

  return createPortal(
    // CAMADA DE VIDRO FOSCO SUAVE (FUNDO)
    <div className="fixed inset-0 bg-zinc-950/30 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      
      {/* CARD DO FORMULÁRIO BENTO GAVETA */}
      <div className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[28px] shadow-2xl border border-zinc-100 overflow-hidden max-h-[90vh] flex flex-col transform transition-all animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        
        {/* Header Fixo */}
        <div className="p-6 border-b border-[#F3F3F3] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-extrabold tracking-tight text-[#1A1A1A]">Dados de Entrega</h2>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">AceleraFood Checkout</p>
          </div>
          <button 
            type="button" 
            onClick={onFechar} 
            className="w-6 h-6 bg-[#F3F3F3] rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-500 hover:bg-zinc-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Formulário Unificado Mobile-First */}
        <form onSubmit={handleRedirecionarStripe} className="p-6 overflow-y-auto flex-1 space-y-4">
          
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Seu Nome</label>
            <input 
              type="text" 
              required 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
              placeholder="Como te chamamos?" 
              className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none focus:bg-white focus:border-zinc-300 transition-all placeholder-zinc-400" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">WhatsApp / Telefone</label>
            <input 
              type="tel" 
              required 
              value={telefone} 
              onChange={(e) => setTelefone(e.target.value)} 
              placeholder="(61) 99999-0000" 
              className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none focus:bg-white focus:border-zinc-300 transition-all placeholder-zinc-400" 
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Rua / Av.</label>
              <input 
                type="text" 
                required 
                value={rua} 
                onChange={(e) => setRua(e.target.value)} 
                placeholder="Endereço de entrega" 
                className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none focus:bg-white focus:border-zinc-300 transition-all placeholder-zinc-400" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Número</label>
              <input 
                type="text" 
                required 
                value={numero} 
                onChange={(e) => setNumero(e.target.value)} 
                placeholder="Nº" 
                className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none focus:bg-white focus:border-zinc-300 transition-all placeholder-zinc-400" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Bairro</label>
            <input 
              type="text" 
              required 
              value={bairro} 
              onChange={(e) => setBairro(e.target.value)} 
              placeholder="Nome do Bairro" 
              className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none focus:bg-white focus:border-zinc-300 transition-all placeholder-zinc-400" 
            />
          </div>

          {/* Resumo do Valor Total do Pedido */}
          <div className="bg-[#F8F8F8] border border-zinc-100 rounded-[18px] p-3.5 flex items-center justify-between mt-2 select-none">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total da Sacola</span>
            <span className="font-black text-sm text-zinc-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
            </span>
          </div>

          {/* Botões Inferiores de Ação */}
          <div className="flex items-center gap-3 pt-2">
            <button 
              type="button" 
              onClick={onFechar} 
              className="flex-1 py-2.5 bg-[#F3F3F3] text-zinc-500 font-bold text-xs rounded-[14px] hover:bg-zinc-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isPending} 
              className={`flex-1 py-2.5 text-white font-black text-xs rounded-[14px] shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 ${corTema}`}
            >
              {isPending ? 'Conectando Stripe...' : 'Ir para o Pagamento'}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
}
