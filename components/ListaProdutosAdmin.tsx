// components/ListaProdutosAdmin.tsx
'use client';

import { useState, useTransition } from 'react';
import { 
  ItemCardapioComCMV, 
  atualizarStatusEmLote,
  alternarDisponibilidadeProduto,
  excluirProdutosEmLote
} from '@/actions/admin';
import { Insumo } from '@/types/database';
import { useRouter } from 'next/navigation';
import BarraAcoesLote from './cardapio-admin/BarraAcoesLote';
import CardProdutoAdmin from './cardapio-admin/CardProdutoAdmin';
import ModalNovoProduto from './cardapio-admin/ModalNovoProduto';

interface ListaProdutosProps {
  produtosIniciais: ItemCardapioComCMV[];
  insumosDisponiveis: Insumo[];
}

/**
 * Painel Gerencial do Gestor: Lista todos os hambúrgueres cadastrados,
 * exibe o CMV reativo e dispara o modal configurado para novos adicionais livres.
 */
export default function ListaProdutosAdmin({ 
  produtosIniciais, 
  insumosDisponiveis
}: ListaProdutosProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalAberto, setModalAberto] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const handleToggleSelect = (id: string) => {
    setSelecionados(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelecionarTodos = () => {
    if (selecionados.length === produtosIniciais.length) {
      setSelecionados([]);
    } else {
      setSelecionados(produtosIniciais.map(p => p.id));
    }
  };

  const handleAlterarStatusEmLote = (novoStatus: boolean) => {
    if (selecionados.length === 0) return;
    startTransition(async () => {
      try {
        await atualizarStatusEmLote(selecionados, novoStatus);
        setSelecionados([]);
        router.refresh();
      } catch (err) {
        console.error("Erro na operação em lote:", err);
      }
    });
  };

  const handleExcluirSelecionados = () => {
    if (selecionados.length === 0) return;
    if (!confirm('Deseja apagar os produtos selecionados? Essa ação não pode ser desfeita.')) return;

    startTransition(async () => {
      const resultado = await excluirProdutosEmLote(selecionados);
      if (resultado.success) {
        setSelecionados([]);
        router.refresh();
        return;
      }
      alert(resultado.error || 'Não foi possível apagar os produtos selecionados.');
    });
  };

  const handleAlternarStatusProduto = (id: string, statusAtual: boolean) => {
    startTransition(async () => {
      try {
        await alternarDisponibilidadeProduto(id, statusAtual);
        router.refresh();
      } catch (error) {
        console.error('Erro ao alternar status do produto:', error);
      }
    });
  };

  const handleExcluirProduto = (id: string, nome: string) => {
    if (!confirm(`Deseja apagar o item "${nome}"?`)) return;

    startTransition(async () => {
      const resultado = await excluirProdutosEmLote([id]);
      if (resultado.success) {
        setSelecionados((prev) => prev.filter((itemId) => itemId !== id));
        router.refresh();
        return;
      }
      alert(resultado.error || 'Não foi possível apagar o item.');
    });
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
      
      {/* BARRA DE OPERAÇÕES EM LOTE */}
      <BarraAcoesLote 
        todosSelecionados={selecionados.length === produtosIniciais.length && produtosIniciais.length > 0}
        onSelecionarTodos={handleSelecionarTodos}
        qtdSelecionados={selecionados.length}
        onAlterarStatus={handleAlterarStatusEmLote}
        onExcluirSelecionados={handleExcluirSelecionados}
        isPending={isPending}
      />

      {/* VITRINE ADMINISTRATIVA DE ITENS */}
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Hambúrgueres ativos</h3>
          <button 
            type="button"
            onClick={() => setModalAberto(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#E16349] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#c8523a]"
          >
            + Novo Hambúrguer
          </button>
        </div>

        <div className="max-h-[55vh] space-y-3 overflow-y-auto">
          {produtosIniciais.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-400">Nenhum hambúrguer cadastrado no cardápio.</p>
          ) : (
            produtosIniciais.map((produto) => (
              <CardProdutoAdmin 
                key={produto.id}
                produto={produto}
                isSelecionado={selecionados.includes(produto.id)}
                onToggleSelect={() => handleToggleSelect(produto.id)}
                onAlternarStatus={() => handleAlternarStatusProduto(produto.id, produto.disponivel)}
                onExcluir={() => handleExcluirProduto(produto.id, produto.nome)}
                isPending={isPending}
              />
            ))
          )}
        </div>
      </div>

      {/* PORTAL DO MODAL DE ENGENHARIA DE ADICIONAIS LIVRES */}
      <ModalNovoProduto 
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        insumosDisponiveis={insumosDisponiveis}
      />
    </section>
  );
}
