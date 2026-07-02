// actions/cardapio.ts
import { supabase } from '@/lib/supabase';
import { ItemCardapio, Restaurante } from '@/types/database';

interface DadosCardapio {
  restaurante: Restaurante | null;
  produtos: ItemCardapio[];
}

export async function obterDadosCardapioPorSlug(slug: string): Promise<DadosCardapio> {
  // 1. Busca o restaurante pelo slug único da URL
  const { data: restaurante, error: errRestaurante } = await supabase
    .from('restaurantes')
    .select('*')
    .eq('slug', slug)
    .single(); // Traz apenas um registro

  if (errRestaurante || !restaurante) {
    console.error(`Restaurante não encontrado para o slug: ${slug}`, errRestaurante);
    return { restaurante: null, produtos: [] };
  }

  // 2. Busca apenas os produtos que pertencem a este restaurante específico
  const { data: produtos, error: errProdutos } = await supabase
    .from('itens_cardapio')
    .select('*')
    .eq('restaurante_id', restaurante.id)
    .eq('disponivel', true);

  if (errProdutos) {
    console.error('Erro ao buscar produtos do restaurante:', errProdutos);
    return { restaurante, produtos: [] };
  }

  return {
    restaurante,
    produtos: produtos || []
  };
}
