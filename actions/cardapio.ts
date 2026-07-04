// actions/cardapio.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { ItemCardapio, Restaurante } from '@/types/database';

interface DadosCardapio {
  restaurante: Restaurante | null;
  produtos: ItemCardapio[];
}

export async function obterDadosCardapioPorSlug(slug: string): Promise<DadosCardapio> {
  try {
    // Inicializa o cliente do servidor assíncrono
    const supabase = await createClient();

    if (!slug) {
      return { restaurante: null, produtos: [] };
    }

    // 1. Busca o restaurante pelo slug único da URL pública (Ex: /acelera-acai)
    // O banco usa um índice B-Tree otimizado aqui para buscas instantâneas
    const { data: restaurante, error: errRestaurante } = await supabase
      .from('restaurantes')
      .select('*')
      .eq('slug', slug)
      .maybeSingle(); // Usamos maybeSingle para retornar nulo graciosamente se o slug não existir

    if (errRestaurante || !restaurante) {
      console.error(`Restaurante não encontrado para o slug: ${slug}`, errRestaurante);
      return { restaurante: null, produtos: [] };
    }

    // 2. Busca apenas os produtos disponíveis que pertencem a este restaurante específico
    const { data: produtos, error: errProdutos } = await supabase
      .from('itens_cardapio')
      .select('*')
      .eq('restaurante_id', restaurante.id)
      .eq('disponivel', true)
      .order('nome', { ascending: true }); // Ordenação limpa para experiência do usuário no cardápio

    if (errProdutos) {
      console.error('Erro ao buscar produtos do restaurante:', errProdutos);
      return { restaurante, produtos: [] };
    }

    return {
      restaurante,
      produtos: produtos || []
    };
  } catch (error) {
    console.error(`Erro crítico na action obterDadosCardapioPorSlug para o slug [${slug}]:`, error);
    return { restaurante: null, produtos: [] };
  }
}
