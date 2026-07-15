// components/cardapio-admin/ModalNovoProduto.tsx
'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Insumo } from '@/types/database';
import { InsumoFichaInput, AdicionalCustomizado } from '@/actions/admin';
import { AbaDadosBasicos, AbaFichaTecnica, AbaAdicionaisOpcionais } from './AbasFormularioProduto';

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (
    nome: string, 
    descricao: string, 
    preco: number, 
    fichaTecnica: InsumoFichaInput[], 
    complementos: AdicionalCustomizado[]
  ) => void;
  isPending: boolean;
  insumosDisponiveis: Insumo[];
}

type AbaFormulario = 'DADOS' | 'INGREDIENTES' | 'ADICIONAIS';

export default function ModalNovoProduto({ aberto, onFechar, onSalvar, isPending, insumosDisponiveis }: ModalProps) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<AbaFormulario>('DADOS');
  const [mounted, setMounted] = useState(false);
  
  const [quantidadesFicha, setQuantidadesFicha] = useState<Record<string, string>>({});
  const [adicionais, setAdicionais] = useState<AdicionalCustomizado[]>([]);
  const [novoNomeAdicional, setNovoNomeAdicional] = useState('');
  const [novoPrecoAdicional, setNovoPrecoAdicional] = useState('');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!aberto || !mounted) return null;

  const handleFichaChange = (insumoId: string, valor: string) => {
    setQuantidadesFicha(prev => ({ ...prev, [insumoId]: valor }));
  };

  const handleAdicionarItemComplemento = () => {
    if (!novoNomeAdicional || !novoPrecoAdicional) return;
    setAdicionais(prev => [...prev, { nome: novoNomeAdicional, preco: parseFloat(novoPrecoAdicional) }]);
    setNovoNomeAdicional('');
    setNovoPrecoAdicional('');
  };

  const handleRemoverAdicional = (index: number) => {
    setAdicionais(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !preco) return;

    const fichaPronta: InsumoFichaInput[] = Object.entries(quantidadesFicha)
      .filter(([_, qtd]) => qtd && parseFloat(qtd) > 0)
      .map(([insumoId, qtd]) => ({ insumo_id: insumoId, quantidade_necessaria: parseFloat(qtd) }));

    onSalvar(nome, descricao, parseFloat(preco), fichaPronta, adicionais);
    
    setNome(''); 
    setDescricao(''); 
    setPreco(''); 
    setQuantidadesFicha({}); 
    setAdicionais([]);
    setAbaAtiva('DADOS');
  };

  return createPortal(
    <div className="fixed inset-0 bg-zinc-950/20 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[28px] border border-zinc-100 shadow-2xl w-full max-w-lg overflow-hidden my-auto max-h-[90vh] flex flex-col font-sans">
        
        {/* CABEÇALHO */}
        <div className="p-6 border-b border-[#F3F3F3] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-extrabold tracking-tight text-[#1A1A1A]">Configuração do Novo Hambúrguer</h2>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">Engenharia de Produto Integrada</p>
          </div>
          <button type="button" onClick={onFechar} className="w-6 h-6 bg-[#F3F3F3] text-zinc-500 rounded-full flex items-center justify-center text-[10px] font-bold hover:bg-zinc-200 transition-colors">✕</button>
        </div>

        {/* CONTROLE DE ABAS */}
        <div className="flex bg-[#F3F3F3] p-1 gap-1 mx-6 mt-4 rounded-xl text-[11px] font-bold shrink-0">
          <button type="button" onClick={() => setAbaAtiva('DADOS')} className={`flex-1 py-2 rounded-lg transition-all ${abaAtiva === 'DADOS' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'}`}>Dados Básicos</button>
          <button type="button" onClick={() => setAbaAtiva('INGREDIENTES')} className={`flex-1 py-2 rounded-lg transition-all ${abaAtiva === 'INGREDIENTES' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'}`}>Ficha Técnica</button>
          <button type="button" onClick={() => setAbaAtiva('ADICIONAIS')} className={`flex-1 py-2 rounded-lg transition-all ${abaAtiva === 'ADICIONAIS' ? 'bg-white text-[#E52521] shadow-sm' : 'text-zinc-400'}`}>Adicionais Opcionais</button>
        </div>

        {/* FORMULÁRIO DINÂMICO */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col justify-between">
          
          {abaAtiva === 'DADOS' && (
            <AbaDadosBasicos nome={nome} setNome={setNome} descricao={descricao} setDescricao={setDescricao} preco={preco} setPreco={setPreco} />
          )}

          {abaAtiva === 'INGREDIENTES' && (
            <AbaFichaTecnica insumosDisponiveis={insumosDisponiveis} quantidadesFicha={quantidadesFicha} onFichaChange={handleFichaChange} />
          )}

          {abaAtiva === 'ADICIONAIS' && (
            <AbaAdicionaisOpcionais 
              adicionais={adicionais} novoNome={novoNomeAdicional} setNovoNome={setNovoNomeAdicional} 
              novoPreco={novoPrecoAdicional} setNovoPreco={setNovoPrecoAdicional}
              onAdicionar={handleAdicionarItemComplemento} onRemover={handleRemoverAdicional} 
            />
          )}

          {/* BOTÕES DE SUBMISSÃO */}
          <div className="flex items-center gap-3 pt-4 border-t border-[#F3F3F3] shrink-0 mt-6">
            <button type="button" onClick={onFechar} className="flex-1 py-2.5 bg-[#F3F3F3] text-zinc-500 font-bold text-xs rounded-[14px] hover:bg-zinc-200 transition-colors">Cancelar</button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-[#E52521] text-white font-bold text-xs rounded-[14px] hover:bg-red-700 shadow-sm disabled:opacity-50 transition-colors">
              {isPending ? 'Salvando...' : 'Criar Hambúrguer'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
