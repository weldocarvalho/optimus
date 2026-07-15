// components/cardapio-admin/ModalNovoProduto.tsx (Parte 1 de 2)
'use client'

import React, { useState, useTransition } from 'react'
import { criarProdutoAdmin } from '@/actions/cardapio'
import { createPortal } from 'react-dom'
import { Insumo } from '@/types/database'
import { AbaDadosBasicos, AbaFichaTecnica, AbaAdicionaisOpcionais } from './AbasFormularioProduto'
import { useRouter } from 'next/navigation'

interface ModalNovoProdutoProps {
  aberto: boolean
  onFechar: () => void
  insumosDisponiveis: Insumo[] // Insumos carregados previamente pelo pai para evitar prop drilling ou fetches extras
}

export default function ModalNovoProduto({ aberto, onFechar, insumosDisponiveis }: ModalNovoProdutoProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [abaAtiva, setAbaAtiva] = useState<'DADOS' | 'FICHA' | 'ADICIONAIS'>('DADOS')

  // --- Estados do Formulário ---
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState('')
  const [quantidadesFicha, setQuantidadesFicha] = useState<Record<string, string>>({})
  const [adicionais, setAdicionais] = useState<Array<{ nome: string; preco: number }>>([])

  // --- Estados Locais de Inserção de Adicional ---
  const [novoAdicionalNome, setNovoAdicionalNome] = useState('')
  const [novoAdicionalPreco, setNovoAdicionalPreco] = useState('')

  if (!aberto || typeof document === 'undefined') return null

  const handleFichaChange = (id: string, valor: string) => {
    setQuantidadesFicha(prev => ({ ...prev, [id]: valor }))
  }

  const handleAdicionarOpcional = () => {
    if (!novoAdicionalNome || !novoAdicionalPreco) return
    setAdicionais(prev => [...prev, { nome: novoAdicionalNome, preco: parseFloat(novoAdicionalPreco) }])
    setNovoAdicionalNome('')
    setNovoAdicionalPreco('')
  }

  const handleRemoverOpcional = (indexParaRemover: number) => {
    setAdicionais(prev => prev.filter((_, idx) => idx !== indexParaRemover))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome || !preco) {
      alert('Por favor, preencha os campos obrigatórios (Nome e Preço).')
      return
    }

    startTransition(async () => {
      const resultado = await criarProdutoAdmin({
        nome,
        descricao,
        preco_venda: parseFloat(preco),
        disponivel: true, // Registra o hambúrguer ativo e visível por padrão
        fichaTecnica: quantidadesFicha,
        adicionais
      })

      if (resultado.success) {
        // Reset completo do estado da máquina
        setNome('')
        setDescricao('')
        setPreco('')
        setQuantidadesFicha({})
        setAdicionais([])
        setAbaAtiva('DADOS')
        onFechar()
        router.refresh()
      } else {
        alert(`Erro de Integração: ${resultado.error}`)
      }
    })
  }
  
  return createPortal(
    <div className="fixed inset-0 bg-zinc-950/20 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-200">
      <div className="bg-white rounded-[28px] border border-zinc-100 shadow-2xl shadow-zinc-400/40 w-full max-w-xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabeçalho do Modal */}
        <div className="p-6 border-b border-[#F3F3F3] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold tracking-tight text-[#1A1A1A]">Novo Hambúrguer & Configuração</h2>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">Catálogo Geral & Engenharia Financeira</p>
          </div>
          <button 
            type="button" 
            onClick={onFechar} 
            className="w-6 h-6 bg-[#F3F3F3] hover:bg-zinc-200 text-zinc-500 rounded-full flex items-center justify-center transition-colors text-[10px] font-bold"
          >
            ✕
          </button>
        </div>

        {/* Sistema de Navegação Neomórfico por Abas */}
        <div className="flex border-b border-[#F3F3F3] bg-[#F8F8F8] p-1 font-bold text-[11px] shrink-0">
          <button
            type="button"
            onClick={() => setAbaAtiva('DADOS')}
            className={`flex-1 text-center py-2.5 rounded-[10px] transition-all ${abaAtiva === 'DADOS' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            Dados do Cardápio
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('FICHA')}
            className={`flex-1 text-center py-2.5 rounded-[10px] transition-all ${abaAtiva === 'FICHA' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            Ficha Técnica (CMV)
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('ADICIONAIS')}
            className={`flex-1 text-center py-2.5 rounded-[10px] transition-all ${abaAtiva === 'ADICIONAIS' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            Opcionais Adicionais
          </button>
        </div>

        {/* Corpo Dinâmico / Injeção das Abas */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          <div className="min-h-[220px] flex flex-col">
            {abaAtiva === 'DADOS' && (
              <AbaDadosBasicos 
                nome={nome} setNome={setNome}
                descricao={descricao} setDescricao={setDescricao}
                preco={preco} setPreco={setPreco}
              />
            )}

            {abaAtiva === 'FICHA' && (
              <AbaFichaTecnica 
                insumosDisponiveis={insumosDisponiveis}
                quantidadesFicha={quantidadesFicha}
                onFichaChange={handleFichaChange}
              />
            )}

            {abaAtiva === 'ADICIONAIS' && (
              <AbaAdicionaisOpcionais 
                adicionais={adicionais}
                novoNome={novoAdicionalNome} setNovoNome={setNovoAdicionalNome}
                novoPreco={novoAdicionalPreco} setNovoPreco={setNovoAdicionalPreco}
                onAdicionar={handleAdicionarOpcional}
                onRemover={handleRemoverOpcional}
              />
            )}
          </div>

          {/* Rodapé Operacional com Feedback Visual de Carregamento */}
          <div className="flex items-center gap-3 pt-2 border-t border-[#F3F3F3]">
            <button 
              type="button" 
              onClick={onFechar} 
              className="flex-1 py-3 bg-[#F3F3F3] text-zinc-500 font-bold text-xs rounded-[14px] hover:bg-zinc-200 transition-colors uppercase tracking-wider"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isPending} 
              className="flex-1 py-3 bg-[#E16349] text-white font-bold text-xs rounded-[14px] hover:bg-[#c8523a] shadow-sm disabled:opacity-50 transition-all uppercase tracking-wider"
            >
              {isPending ? 'Sincronizando Ecossistema...' : 'Confirmar & Publicar'}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  )
}
