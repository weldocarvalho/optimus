// app/(dashboard)/admin/produtos/page.tsx
import { listarProdutosComCMV } from '@/actions/admin';
import { listarInsumosAdmin } from '@/actions/adminInsumos'; // Importa a busca de estoque existente
import { BotaoLogout } from '@/app/logout/logout';
import ListaProdutosAdmin from '@/components/ListaProdutosAdmin';
import Link from 'next/link';

export const revalidate = 0; 

export default async function PainelProdutosAdmin() {
  // Chamadas paralelas ultra-rápidas no servidor do Next.js
  const produtos = await listarProdutosComCMV();
  const insumos = await listarInsumosAdmin();

  return (
    <div className="min-h-screen bg-[#F3F3F3] text-[#1A1A1A] font-sans antialiased flex items-start justify-center p-4 sm:p-8 md:py-12">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* BLOCO SUPERIOR COM BRANDING ENTERPRISE */}
        <header className="bg-white rounded-[24px] p-6 shadow-sm shadow-zinc-300/40 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-3.5 select-none">
            <div className="w-11 h-11 rounded-full bg-[#F3F3F3] border border-zinc-200/60 flex items-center justify-center text-zinc-400 shrink-0 shadow-inner">
              <svg className="w-5 h-5 text-[#E16349]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m0 0a3.001 3.001 0 00-3.75-.615A2.993 2.993 0 009.75 9.75c0 .358.063.702.18 1.025m10.965-1.426c.229-.112.483-.174.75-.174a1.5 1.5 0 011.5 1.5v6.75m-4.5-9a3.97 3.97 0 00-1.22-.112m-1.48 1.137A3.987 3.987 0 0112 11.25c-1.192 0-2.261-.523-3-1.362m-.75 0a3.987 3.987 0 01-3-1.362m0 0a3 3 0 00-3.75.615A2.993 2.993 0 001.5 9.75c0 .358.063.702.18 1.025m0 0A3.987 3.987 0 013 11.25c1.192 0 2.261-.523 3-1.362m0 0c.267.267.58.483.925.64" />
              </svg>
            </div>
            <div className="leading-tight">
              <h2 className="font-black text-lg tracking-tight text-[#1A1A1A]">Acelera Burger</h2>
              <span className="text-[11px] font-bold tracking-tight text-[#E16349] block mt-0.5">AceleraFood Tech</span>
            </div>

            <BotaoLogout />
          </div>

          

          <nav className="flex items-center gap-1 bg-[#F3F3F3] p-1.5 rounded-[16px] overflow-x-auto">
            <Link href="/admin/produtos" className="flex items-center gap-1.5 px-4 py-2 rounded-[12px] text-xs font-bold bg-[#E16349] text-white shadow-sm transition-all shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Cardápio
            </Link>
            <Link href="/admin/insumos" className="flex items-center gap-1.5 px-4 py-2 rounded-[12px] text-xs font-semibold text-zinc-500 hover:text-[#1A1A1A] transition-all shrink-0">
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Insumos
            </Link>
            <Link href="/admin/metricas" className="flex items-center gap-1.5 px-4 py-2 rounded-[12px] text-xs font-semibold text-zinc-500 hover:text-[#1A1A1A] transition-all shrink-0">
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Métricas
            </Link>
          </nav>
        </header>

        {/* CONTAINER DO PRODUTO ATUALIZADO: Injeta tanto os produtos com CMV quanto os insumos brutos do banco */}
        <ListaProdutosAdmin produtosIniciais={produtos} insumosDisponiveis={insumos} />

      </div>
    </div>
  );
}
