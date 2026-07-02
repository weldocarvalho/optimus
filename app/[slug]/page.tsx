// app/[slug]/page.tsx
import { obterDadosCardapioPorSlug } from '@/actions/cardapio';
import { notFound } from 'next/navigation';

export const revalidate = 10; 

// Atualizamos a tipagem para refletir que params é uma Promise no Next.js moderno
interface PaginaCardapioProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PaginaCardapio({ params }: PaginaCardapioProps) {
  // CRUCIAL: Aguarda a Promise do params resolver antes de acessar o slug
  const { slug } = await params;
  
  // Agora o slug irá preenchido corretamente ("acelera-burger" ou "acelera-acai")
  const { restaurante, produtos } = await obterDadosCardapioPorSlug(slug);

  // Se o slug não existir no banco, joga o cliente para uma página 404 limpa
  if (!restaurante) {
    notFound();
  }

  const ehAcai = restaurante.tipo === 'ACAI';
  const emojiVisual = ehAcai ? '🍧' : '🍔';
  const corDestaque = ehAcai ? 'text-purple-700 bg-purple-50' : 'text-amber-600 bg-amber-50';
  const corBotao = ehAcai ? 'bg-purple-900 hover:bg-purple-800' : 'bg-zinc-900 hover:bg-zinc-800';

  return (
    <main className="min-h-screen bg-zinc-50 pb-24">
      {/* Cabeçalho Dinâmico e Customizado com Logo de Alta Performance */}
      <header className="bg-white border-b border-zinc-200 py-6 text-center shadow-sm flex flex-col items-center">
        <div className="w-16 h-16 mb-2">
          {/* Renderiza a logo SVG da pasta public */}
          <img src="/logo.svg" alt="Acelera Food Logo" className="w-full h-full object-contain" />
        </div>
        <span className="text-[10px] font-black tracking-widest text-orange-600 uppercase bg-orange-50 px-2 py-0.5 rounded-full">
          Plataforma Acelera Food
        </span>
        <h1 className="text-xl font-black text-zinc-900 tracking-tight mt-2 uppercase">
          {restaurante.nome}
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Seja bem-vindo! Peça e acompanhe em tempo real.
        </p>
      </header>

      {/* Listagem de Itens */}
      <div className="max-w-xl mx-auto px-4 mt-6 space-y-4">
        {produtos.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 bg-white border border-zinc-200 rounded-xl">
            <p className="font-medium">O cardápio está em manutenção.</p>
            <p className="text-xs mt-1 text-zinc-400">Nenhum produto disponível para este estabelecimento no momento.</p>
          </div>
        ) : (
          produtos.map((produto) => (
            <div 
              key={produto.id} 
              className="bg-white border border-zinc-200 rounded-xl p-4 flex gap-4 shadow-sm items-center hover:border-zinc-300 transition-all"
            >
              <div className={`w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0 text-3xl shadow-inner ${corDestaque}`}>
                {emojiVisual}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-zinc-950 truncate text-base">{produto.nome}</h3>
                <p className="text-zinc-500 text-xs mt-0.5 line-clamp-2 leading-relaxed">
                  {produto.descricao || 'Sem descrição disponível.'}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-black text-emerald-600 text-base">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(produto.preco_venda))}
                  </span>
                  <button className={`text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors shadow-sm ${corBotao}`}>
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
