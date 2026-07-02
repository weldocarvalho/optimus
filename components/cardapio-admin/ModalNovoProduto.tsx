// components/cardapio-admin/ModalNovoProduto.tsx
'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Insumo } from '@/types/database';
import { InsumoVinculadoInput } from '@/actions/admin';

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (nome: string, descricao: string, preco: number, insumos: InsumoVinculadoInput[]) => void;
  isPending: boolean;
  insumosDisponiveis: Insumo[]; // Nova prop essencial
}

export default function ModalNovoProduto({ aberto, onFechar, onSalvar, isPending, insumosDisponiveis }: ModalProps) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // Estado para armazenar as quantidades digitadas por insumo_id
  const [quantidades, setQuantidades] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!aberto || !mounted) return null;

  const handleQuantidadeChange = (insumoId: string, valor: string) => {
    setQuantidades(prev => ({ ...prev, [insumoId]: valor }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !preco) return;

    // Filtra apenas os insumos onde o usuário de fato digitou uma quantidade maior que zero
    const insumosProntos: InsumoVinculadoInput[] = Object.entries(quantidades)
      .filter(([_, qtd]) => qtd && parseFloat(qtd) > 0)
      .map(([insumoId, qtd]) => ({
        insumo_id: insumoId,
        quantidade_necessaria: parseFloat(qtd)
      }));

    onSalvar(nome, descricao, parseFloat(preco), insumosProntos);
    
    // Limpa estados
    setNome(''); setDescricao(''); setPreco(''); setQuantidades({});
  };

  return createPortal(
    <div className="fixed inset-0 bg-zinc-950/20 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[28px] border border-zinc-100 shadow-2xl w-full max-w-lg overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Header fixo */}
        <div className="p-6 border-b border-[#F3F3F3] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-extrabold tracking-tight text-[#1A1A1A]">Novo Item com Ficha Técnica</h2>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">Vínculo Dinâmico de CMV</p>
          </div>
          <button type="button" onClick={onFechar} className="w-6 h-6 bg-[#F3F3F3] hover:bg-zinc-200 text-zinc-500 rounded-full flex items-center justify-center text-[10px] font-bold">✕</button>
        </div>

        {/* Formulário com rolagem interna para não quebrar telas de notebooks */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Dados básicos */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Nome do Produto</label>
              <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Acelera Double Cheddar" className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#E16349] placeholder-zinc-400" />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Descrição / Detalhes</label>
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva os componentes..." rows={2} className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#E16349] placeholder-zinc-400 resize-none" />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Preço de Venda (R$)</label>
              <input type="number" step="0.01" required value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="0,00" className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#E16349] placeholder-zinc-400" />
            </div>
          </div>

          {/* NOVA SEÇÃO: SELETOR DE FICHA TÉCNICA REATIVO */}
          <div className="space-y-2 border-t border-[#F3F3F3] pt-4">
            <label className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-wider block">Ficha Técnica / Ingredientes</label>
            <p className="text-[11px] text-zinc-400 font-medium">Insira a quantidade usada deste insumo para calcular o custo automático.</p>
            
            <div className="bg-[#F8F8F8] rounded-[20px] border border-zinc-100 p-3 space-y-1.5 max-h-48 overflow-y-auto">
              {insumosDisponiveis.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-4 italic">Nenhum insumo disponível. Cadastre na aba Insumos primeiro.</p>
              ) : (
                insumosDisponiveis.map((insumo) => (
                  <div key={insumo.id} className="flex items-center justify-between p-2 rounded-xl bg-white border border-transparent hover:border-zinc-200/50 transition-all gap-4">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-zinc-800 block truncate">{insumo.nome}</span>
                      <span className="text-[9px] text-zinc-400 font-medium">Unidade padrão: {insumo.unidade_medida}</span>
                    </div>
                    {/* Input de quantidade do ingrediente */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input 
                        type="number" 
                        step="0.0001"
                        placeholder="0"
                        value={quantidades[insumo.id] || ''}
                        onChange={(e) => handleQuantidadeChange(insumo.id, e.target.value)}
                        className="w-20 text-center bg-[#F3F3F3] border border-transparent rounded-lg py-1 text-xs font-bold focus:outline-none focus:bg-white focus:border-[#E16349]"
                      />
                      <span className="text-[10px] text-zinc-400 font-bold uppercase w-5">{insumo.unidade_medida}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Botões fixos inferiores */}
          <div className="flex items-center gap-3 pt-2 shrink-0">
            <button type="button" onClick={onFechar} className="flex-1 py-2.5 bg-[#F3F3F3] text-zinc-500 font-bold text-xs rounded-[14px] hover:bg-zinc-200">Cancelar</button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-[#E16349] text-white font-bold text-xs rounded-[14px] hover:bg-[#c8523a] shadow-sm disabled:opacity-50">{isPending ? 'Criar com Ficha' : 'Criar com Ficha'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
