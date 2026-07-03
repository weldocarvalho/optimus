// actions/adminInsumos.ts
'use server';

import { supabase } from '@/lib/supabase';
import { Insumo } from '@/types/database';

// Helper temporário para buscar o restaurante logado
const RESTAURANTE_ID_TESTE = (async () => {
  const { data } = await supabase.from('restaurantes').select('id').eq('slug', 'acelera-acai').single();
  return data?.id;
});

export async function listarInsumosAdmin(): Promise<Insumo[]> {
  const restauranteId = await RESTAURANTE_ID_TESTE();
  
  const { data, error } = await supabase
    .from('insumos')
    .select('*')
    .eq('restaurante_id', restauranteId)
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao listar insumos:', error);
    return [];
  }

  return data || [];
}

export async function criarInsumoAdmin(nome: string, unidade: 'g' | 'ml' | 'un', custo: number, estoqueAtual: number, estoqueMinimo: number) {
  const restauranteId = await RESTAURANTE_ID_TESTE();
  
  if (!nome || custo <= 0) {
    return { success: false, error: 'Nome e custo unitário são obrigatórios.' };
  }

  const { error } = await supabase
    .from('insumos')
    .insert([
      {
        restaurante_id: restauranteId,
        nome,
        unidade_medida: unidade,
        custo_unitario: custo,
        estoque_atual: estoqueAtual,
        estoque_minimo: estoqueMinimo
      }
    ]);

  if (error) {
    console.error('Erro ao criar insumo:', error);
    return { success: false, error };
  }

  return { success: true };
}

export async function excluirInsumosEmLote(ids: string[]) {
  if (ids.length === 0) return { success: true };

  const { error } = await supabase
    .from('insumos')
    .delete()
    .in('id', ids);

  if (error) {
    console.error('Erro ao excluir insumos em lote:', error);
    return { success: false, error };
  }

  return { success: true };
}

export async function atualizarCustoInsumoAdmin(id: string, novoCusto: number, estoqueAtual: number, estoqueMinimo: number) {
  if (!id || novoCusto <= 0) {
    return { success: false, error: 'Dados inválidos para atualização.' };
  }

  const { error } = await supabase
    .from('insumos')
    .update({
      custo_unitario: novoCusto,
      estoque_atual: estoqueAtual,
      estoque_minimo: estoqueMinimo
    })
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar custo do insumo:', error);
    return { success: false, error };
  }

  return { success: true };
}
