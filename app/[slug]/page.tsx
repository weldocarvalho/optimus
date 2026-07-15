// app/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { obterCardapioPorSlug } from '@/actions/cardapio';
import ComponenteLojaHamburguer from '@/components/ecommerce/ComponenteLojaHamburguer';


interface PaginaCardapioProps {
  params: Promise<{
    slug: string;
  }>;
}

interface ComplementoProdutoPagina {
  id: string;
  item_cardapio_id: string;
  nome: string;
  preco_adicional: number | string;
  disponivel: boolean;
  created_at: string;
}

interface ProdutoPagina {
  id: string;
  restaurante_id: string;
  nome: string;
  descricao: string | null;
  preco_venda: number | string;
  imagem_url: string | null;
  disponivel: boolean;
  created_at: string;
  complementos_produto: ComplementoProdutoPagina[] | null;
}

export const revalidate = 0; // Desativa cache para garantir preços e adicionais atualizados em tempo real

export default async function PaginaCardapioPublico({ params }: PaginaCardapioProps) {
  // Resolve os parâmetros assíncronos da rota dinamicamente conforme padrão do Next.js
  const { slug } = await params;

  // Realiza a chamada relacional ao banco via Supabase Server Client
  const { restaurante, produtos } = await obterCardapioPorSlug(slug);

  // Se o restaurante não existir no banco ou o slug for inválido, joga para a página 404 padrão
  if (!restaurante) {
    notFound();
  }

  // Normaliza os dados tipados para a renderização limpa do componente de vitrine
  const produtosNormalizados = (produtos as ProdutoPagina[]).map((p) => ({
    id: p.id,
    restaurante_id: p.restaurante_id,
    nome: p.nome,
    descricao: p.descricao ?? '',
    preco_venda: Number(p.preco_venda),
    imagem_url: p.imagem_url ?? '',
    disponivel: p.disponivel,
    created_at: p.created_at,
    complementos_produto: (p.complementos_produto || []).map((c) => ({
      id: c.id,
      item_cardapio_id: c.item_cardapio_id,
      nome: c.nome,
      preco_adicional: Number(c.preco_adicional),
      disponivel: c.disponivel,
      created_at: c.created_at,
    })).filter((c) => c.disponivel),
  }));

  return (
    <main className="min-h-screen bg-[#FDFDFD]">
      <ComponenteLojaHamburguer 
        restaurante={{
          id: restaurante.id,
          nome: restaurante.nome
        }} 
        produtos={produtosNormalizados} 
      />
    </main>
  );
}
