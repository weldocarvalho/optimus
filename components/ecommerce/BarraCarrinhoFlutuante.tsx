// components/ecommerce/BarraCarrinhoFlutuante.tsx
'use client';

import { useState } from 'react';
import { useCarrinho } from './ContextoCarrinho';
import { useParams } from 'next/navigation';
import ModalCheckout from './ModalCheckout';

interface BarraProps {
  ehAcai?: boolean;
}

export default function BarraCarrinhoFlutuante({ ehAcai = false }: BarraProps) {
  const params = useParams();
  const slug = (params?.slug as string) || '';
  const { totalItens, valorTotal } = useCarrinho();
  const [checkoutAberto, setCheckoutAberto] = useState(false);

  if (totalItens === 0) return null;

  const corFundoSacola = ehAcai ? 'bg-[#1F0417]/95 border-[#3B0D2C]/40' : 'bg-zinc-950 border-zinc-800/80';
  const corBotaoSacola = ehAcai ? 'bg-[#3B0D2C] hover:bg-[#2C0A25]' : 'bg-[#E16349] hover:bg-[#c8523a]';
  const corSombraSacola = ehAcai ? 'shadow-[#1F0417]/20' : 'shadow-orange-600/10';

  return (
    <>
      {/* BARRA FIXA FLUTUANTE NO RODAPÉ */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-transparent z-40 animate-in slide-in-from-bottom duration-300">
        <div className={`max-w-md mx-auto text-white rounded-[24px] p-4 flex items-center justify-between shadow-2xl backdrop-blur-md border ${corFundoSacola} ${corSombraSacola}`}>
          
          {/* Lado Esquerdo: Totais */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-sm transition-colors ${corBotaoSacola}`}>
              {totalItens}
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">Subtotal</span>
              <span className="font-extrabold text-sm text-white">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
              </span>
            </div>
          </div>

          {/* Lado Direito: Dispara a Abertura do Modal de Checkout */}
          <button 
            onClick={() => setCheckoutAberto(true)}
            className={`text-white font-black text-xs px-5 py-3 rounded-[16px] active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-md ${corBotaoSacola}`}
          >
            Ver Sacola
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>

      {/* MODAL DE CHECKOUT ACOPLADO VIA PORTAL */}
      <ModalCheckout 
        aberto={checkoutAberto} 
        onFechar={() => setCheckoutAberto(false)} 
        slug={slug} 
        ehAcai={ehAcai} 
      />
    </>
  );
}
