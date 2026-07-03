// app/[slug]/page.tsx
import { obterDadosCardapioPorSlug } from '@/actions/cardapio';
import { notFound } from 'next/navigation';
import { ComponenteLojaBurger } from '@/components/ecommerce/ComponenteLojaBurger';
import { ComponenteLojaAcai } from '@/components/ecommerce/ComponenteLojaAcai';

export const revalidate = 10; // Foco em velocidade: cache expira a cada 10 segundos globalmente

interface PaginaCardapioProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PaginaCardapio({ params }: PaginaCardapioProps) {
  const { slug } = await params;
  
  // Busca os dados consolidados do restaurante e produtos de forma atômica no servidor
  const { restaurante, produtos } = await obterDadosCardapioPorSlug(slug);

  // Se o inquilino não existir no banco de dados, despacha o erro 404 nativo
  if (!restaurante) {
    notFound();
  }

  // Conversão segura de tipagem dos produtos para os subcomponentes públicos
  const produtosFormatados = (produtos || []).map(p => ({
    id: p.id,
    nome: p.nome,
    descricao: p.descricao || '',
    preco_venda: Number(p.preco_venda),
    disponivel: p.disponivel
  }));

  // ROTEAMENTO DINÂMICO CAMALEÃO B2C: Entrega a interface isolada por nicho
  if (restaurante.tipo === 'ACAI') {
    return (
      <ComponenteLojaAcai 
        restaurante={{ id: restaurante.id, nome: restaurante.nome }} 
        produtos={produtosFormatados} 
      />
    );
  }

  // Fallback padrão: Hamburgueria ou demais nichos operando sob o Warm Minimalism
  return (
    <ComponenteLojaBurger 
      restaurante={{ id: restaurante.id, nome: restaurante.nome }} 
      produtos={produtosFormatados} 
    />
  );
}
