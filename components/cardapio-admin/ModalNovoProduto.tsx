// components/cardapio-admin/ModalNovoProduto.tsx (Parte 1 de 2)
'use client'

import React, { useState, useTransition } from 'react'
import { criarProdutoAdmin } from '@/actions/cardapio'
import { createPortal } from 'react-dom'
import { Insumo } from '@/types/database'
import { AbaDadosBasicos, AbaFichaTecnica, AbaAdicionaisOpcionais } from './AbasFormularioProduto'
import { useRouter } from 'next/navigation'

const TAMANHO_MAXIMO_IMAGEM_MB = 5

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
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState('')
  const [fotoDataUrl, setFotoDataUrl] = useState('')

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

  const handleSelecionarFoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0]
    if (!arquivo) {
      setFotoPreviewUrl('')
      setFotoDataUrl('')
      return
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(arquivo.type)) {
      alert('Formato inválido. Use PNG, JPG ou WEBP.')
      event.target.value = ''
      return
    }

    const tamanhoMaximoBytes = TAMANHO_MAXIMO_IMAGEM_MB * 1024 * 1024
    if (arquivo.size > tamanhoMaximoBytes) {
      alert(`A imagem deve ter no máximo ${TAMANHO_MAXIMO_IMAGEM_MB}MB.`)
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const resultado = String(reader.result ?? '')
      setFotoPreviewUrl(resultado)
      setFotoDataUrl(resultado)
    }
    reader.readAsDataURL(arquivo)
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
        adicionais,
        imagemDataUrl: fotoDataUrl || undefined
      })

      if (resultado.success) {
        // Reset completo do estado da máquina
        setNome('')
        setDescricao('')
        setPreco('')
        setQuantidadesFicha({})
        setAdicionais([])
        setFotoPreviewUrl('')
        setFotoDataUrl('')
        setAbaAtiva('DADOS')
        onFechar()
        router.refresh()
      } else {
        alert(`Erro de Integração: ${resultado.error}`)
      }
    })
  }
  
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/30 p-4 backdrop-blur-sm transition-all duration-200">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl transform transition-all animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-zinc-100 p-5">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-[#1A1A1A]">Novo hambúrguer e configuração</h2>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Catálogo geral e engenharia financeira</p>
          </div>
          <button 
            type="button" 
            onClick={onFechar} 
            className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-500 transition hover:bg-zinc-200"
          >
            ✕
          </button>
        </div>

        {/* Sistema de Navegação Neomórfico por Abas */}
        <div className="shrink-0 overflow-x-auto border-b border-zinc-100 bg-[#F8F8F8] p-1 text-[11px] font-semibold">
          <div className="flex min-w-[500px]">
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
        </div>

        {/* Corpo Dinâmico / Injeção das Abas */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-5">
          <div className="min-h-[220px] flex flex-col">
            {abaAtiva === 'DADOS' && (
              <AbaDadosBasicos 
                nome={nome} setNome={setNome}
                descricao={descricao} setDescricao={setDescricao}
                preco={preco} setPreco={setPreco}
                fotoPreviewUrl={fotoPreviewUrl}
                onSelecionarFoto={handleSelecionarFoto}
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
          <div className="flex items-center gap-3 border-t border-zinc-100 pt-2">
            <button 
              type="button" 
              onClick={onFechar} 
              className="flex-1 rounded-xl bg-zinc-100 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 hover:bg-zinc-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isPending} 
              className="flex-1 rounded-xl bg-[#E16349] py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#c8523a] disabled:opacity-50 transition-all"
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
