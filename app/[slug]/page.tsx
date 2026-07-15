// app/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { obterCardapioPorSlug } from '@/actions/cardapio';
import ComponenteLojaBurger from '@/components/ecommerce/ComponenteLojaBurger';
import ComponenteLojaAcai from '@/components/ecommerce/ComponenteLojaAcai';


interface PaginaCardapioProps {
  params: Promise<{
    slug: string;
  }>;
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
  const produtosNormalizados = produtos.map((p) => ({
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    preco_venda: Number(p.preco_venda),
    imagem_url: p.imagem_url,
    complementos_produto: (p.complementos_produto || []).map((c: any) => ({
      id: c.id,
      nome: c.nome,
      preco_adicional: Number(c.preco_adicional),
      disponivel: c.disponivel,
    })),
  }));

  return (
    <main className="min-h-screen bg-[#FDFDFD]">
      <ComponenteLojaBurger 
        restaurante={{
          id: restaurante.id,
          nome: restaurante.nome,
          tipo: restaurante.tipo
        }} 
        produtos={produtosNormalizados} 
      />
    </main>
  );
}
