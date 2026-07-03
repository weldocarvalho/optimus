// app/[slug]/page.tsx
import { obterDadosCardapioPorSlug } from '@/actions/cardapio';
import { notFound } from 'next/navigation';
import CardItemCardapio from '@/components/ecommerce/CardItemCardapio';
import BarraCarrinhoFlutuante from '@/components/ecommerce/BarraCarrinhoFlutuante';

export const revalidate = 10; // Foco em velocidade: cache expira a cada 10 segundos

interface PaginaCardapioProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PaginaCardapio({ params }: PaginaCardapioProps) {
  const { slug } = await params;
  const { restaurante, produtos } = await obterDadosCardapioPorSlug(slug);

  if (!restaurante) {
    notFound();
  }

  const ehAcai = restaurante.tipo === 'ACAI';

  return (
    <div className="min-h-screen bg-[#F3F3F3] text-[#1A1A1A] antialiased pb-32">
      
      {/* CARD BENTO SUPERIOR: Cabeçalho do Cardápio do Cliente */}
      <div className="max-w-xl mx-auto px-4 pt-6">
        <header className="bg-white rounded-[24px] p-6 shadow-sm shadow-zinc-300/30 text-center flex flex-col items-center border border-transparent">
          {/* Avatar Vetorial do Estabelecimento */}
          <div className="w-12 h-12 rounded-full bg-[#F3F3F3] border border-zinc-200/50 flex items-center justify-center text-zinc-400 mb-3 shadow-inner">
            <svg className="w-5 h-5 text-[#E16349]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m0 0a3.001 3.001 0 00-3.75-.615A2.993 2.993 0 009.75 9.75c0 .358.063.702.18 1.025m10.965-1.426c.229-.112.483-.174.75-.174a1.5 1.5 0 011.5 1.5v6.75m-4.5-9a3.97 3.97 0 00-1.22-.112m-1.48 1.137A3.987 3.987 0 0112 11.25c-1.192 0-2.261-.523-3-1.362m-.75 0a3.987 3.987 0 01-3-1.362m0 0a3 3 0 00-3.75.615A2.993 2.993 0 001.5 9.75c0 .358.063.702.18 1.025m0 0A3.987 3.987 0 013 11.25c1.192 0 2.261-.523 3-1.362m0 0c.267.267.58.483.925.64" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-zinc-900 tracking-tight uppercase">
            {restaurante.nome}
          </h1>
          <p className="text-xs text-zinc-400 font-medium mt-1">
            Faça seu pedido online e receba em minutos
          </p>
        </header>
      </div>

      {/* GRADE DE SELEÇÃO: Lista de Produtos Reativos */}
      <div className="max-w-xl mx-auto px-4 mt-4 space-y-3">
        {produtos.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 bg-white rounded-[24px] border border-transparent shadow-sm shadow-zinc-300/30">
            <p className="font-bold text-xs">O cardápio está temporariamente indisponível.</p>
          </div>
        ) : (
          produtos.map((produto) => (
            <CardItemCardapio key={produto.id} produto={produto} ehAcai={ehAcai} />
          ))
        )}
      </div>

      {/* Substitua a linha antiga no final do app/[slug]/page.tsx por: */}
      <BarraCarrinhoFlutuante ehAcai={ehAcai} />
      
    </div>
  );
}
