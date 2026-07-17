// app/(dashboard)/admin/produtos/page.tsx
import { listarProdutosComCMV } from '@/actions/admin';
import { listarInsumosAdmin } from '@/actions/adminInsumos'; // Importa a busca de estoque existente
import ListaProdutosAdmin from '@/components/ListaProdutosAdmin';
import { AdminNavHeader } from '@/components/admin/AdminNavHeader';

export const revalidate = 0; 

export default async function PainelProdutosAdmin() {
  // Chamadas paralelas ultra-rápidas no servidor do Next.js
  const produtos = await listarProdutosComCMV();
  const insumos = await listarInsumosAdmin();

  return (
    <div className="min-h-screen bg-[#F3F3F3] text-[#1A1A1A] font-sans antialiased flex items-start justify-center p-4 sm:p-8 md:py-12">
      <div className="w-full max-w-4xl space-y-6">
        
        <AdminNavHeader activeTab="produtos" />

        {/* CONTAINER DO PRODUTO ATUALIZADO: Injeta tanto os produtos com CMV quanto os insumos brutos do banco */}
        <ListaProdutosAdmin produtosIniciais={produtos} insumosDisponiveis={insumos} />

      </div>
    </div>
  );
}
