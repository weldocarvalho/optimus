// components/ListaProdutosAdmin.tsx
'use client';

import { useState, useTransition } from 'react';
import { 
  ItemCardapioComCMV, 
  atualizarStatusEmLote
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

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-zinc-200/40 overflow-hidden font-sans">
      
      {/* BARRA DE OPERAÇÕES EM LOTE */}
      <BarraAcoesLote 
        todosSelecionados={selecionados.length === produtosIniciais.length && produtosIniciais.length > 0}
        onSelecionarTodos={handleSelecionarTodos}
        qtdSelecionados={selecionados.length}
        onAlterarStatus={handleAlterarStatusEmLote}
        isPending={isPending}
      />

      {/* VITRINE ADMINISTRATIVA DE ITENS */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">Hambúrgueres Ativos</h3>
          <button 
            type="button"
            onClick={() => setModalAberto(true)}
            className="bg-[#E16349] hover:bg-[#c8523a] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            ✕ Novo Hambúrguer
          </button>
        </div>

        <div className="divide-y divide-zinc-100 max-h-[50vh] overflow-y-auto pr-1">
          {produtosIniciais.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-12 italic">Nenhum hambúrguer cadastrado no cardápio.</p>
          ) : (
            produtosIniciais.map((produto) => (
              <CardProdutoAdmin 
                key={produto.id}
                produto={produto}
                isSelecionado={selecionados.includes(produto.id)}
                onToggleSelect={() => handleToggleSelect(produto.id)}
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
    </div>
  );
}
