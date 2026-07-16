// actions/cardapio.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface DadosNovoProduto {
  nome: string
  descricao?: string
  preco_venda: number
  disponivel: boolean
  fichaTecnica: Record<string, string> // id_insumo (UUID) -> quantidade em string vinda do input
  adicionais: Array<{ nome: string; preco: number }>
  imagemDataUrl?: string
}

const BUCKET_IMAGENS_PRODUTOS =
  process.env.SUPABASE_PRODUTOS_BUCKET ??
  process.env.WCS_GESTOR_INTELIGENTE_CARDAPIO_BUCKET ??
  'produtos'
const TAMANHO_MAXIMO_IMAGEM_BYTES = 5 * 1024 * 1024

function parseImagemDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/)
  if (!match) {
    throw new Error('Formato da imagem inválido. Use PNG, JPG ou WEBP.')
  }

  const mimeType = match[1]
  const base64Data = match[2]
  const buffer = Buffer.from(base64Data, 'base64')

  if (buffer.length === 0) {
    throw new Error('Arquivo de imagem vazio.')
  }
  if (buffer.length > TAMANHO_MAXIMO_IMAGEM_BYTES) {
    throw new Error('A imagem excede o limite de 5MB.')
  }

  const extensaoPorMimeType: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp'
  }

  const extensao = extensaoPorMimeType[mimeType]
  if (!extensao) {
    throw new Error('Tipo de imagem não suportado.')
  }

  return { buffer, mimeType, extensao }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'Erro desconhecido no servidor.'
}

/**
 * Cadastra um novo item de cardápio no Supabase associando-o automaticamente ao restaurante
 * do gestor autenticado, salvando de forma atômica sua ficha técnica e adicionais customizados,
 * e limpando o cache da página pública instantaneamente.
 */
export async function criarProdutoAdmin(dados: DadosNovoProduto) {
  const supabase = await createClient()

  // 1. Recupera o usuário gestor autenticado na sessão do servidor
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Usuário não autenticado no sistema.' }
  }

  // 2. Localiza o restaurante vinculado ao perfil administrativo do usuário
  const { data: perfil, error: perfilError } = await supabase
    .from('perfis_admin')
    .select('restaurante_id')
    .eq('id', user.id)
    .single()

  if (perfilError || !perfil?.restaurante_id) {
    return { success: false, error: 'Nenhum restaurante associado a esta conta de gestor.' }
  }

  const restauranteId = perfil.restaurante_id

  // 3. Captura o slug do restaurante para disparar a revalidação sob demanda na rota pública
  const { data: restaurante, error: restError } = await supabase
    .from('restaurantes')
    .select('slug')
    .eq('id', restauranteId)
    .single()

  if (restError || !restaurante?.slug) {
    return { success: false, error: 'Falha crítica ao obter identificador (slug) da loja.' }
  }

  let caminhoImagemUpload: string | null = null
  let produtoCriado = false

  try {
    let imagemUrl: string | null = null

    if (dados.imagemDataUrl) {
      const imagem = parseImagemDataUrl(dados.imagemDataUrl)
      caminhoImagemUpload = `${restauranteId}/${crypto.randomUUID()}.${imagem.extensao}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_IMAGENS_PRODUTOS)
        .upload(caminhoImagemUpload, imagem.buffer, {
          contentType: imagem.mimeType,
          upsert: false
        })

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error(
            `Bucket "${BUCKET_IMAGENS_PRODUTOS}" não encontrado no Supabase Storage. Crie o bucket ou ajuste SUPABASE_PRODUTOS_BUCKET/.env.local.`
          )
        }
        throw new Error(`Falha ao enviar imagem do produto: ${uploadError.message}`)
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_IMAGENS_PRODUTOS)
        .getPublicUrl(caminhoImagemUpload)

      if (!publicUrlData?.publicUrl) {
        throw new Error('Falha ao gerar URL pública da imagem do produto.')
      }

      imagemUrl = publicUrlData.publicUrl
    }

    // 4. Inserção atômica do item na tabela principal 'itens_cardapio'
    const { data: produto, error: prodError } = await supabase
      .from('itens_cardapio')
      .insert({
        restaurante_id: restauranteId,
        nome: dados.nome,
        descricao: dados.descricao || null,
        preco_venda: dados.preco_venda,
        imagem_url: imagemUrl,
        disponivel: dados.disponivel
      })
      .select()
      .single()

    if (prodError) throw prodError
    produtoCriado = true

    // 5. Inserção da Ficha Técnica na tabela 'composicao_produto' para dedução e análise de CMV
    const insumosFiltrados = Object.entries(dados.fichaTecnica).filter(([, qtd]) => parseFloat(qtd) > 0)
    
    if (insumosFiltrados.length > 0) {
      const composicaoInserts = insumosFiltrados.map(([insumoId, qtd]) => ({
        item_cardapio_id: produto.id,
        insumo_id: insumoId,
        quantidade_necessaria: parseFloat(qtd)
      }))

      const { error: compError } = await supabase
        .from('composicao_produto')
        .insert(composicaoInserts)

      if (compError) throw compError
    }

    // 6. Inserção dos Adicionais Opcionais na tabela 'complementos_produto'
    if (dados.adicionais.length > 0) {
      const complementosInserts = dados.adicionais.map(adicional => ({
        item_cardapio_id: produto.id,
        nome: adicional.nome,
        preco_adicional: adicional.preco,
        disponivel: true
      }))

      const { error: complError } = await supabase
        .from('complementos_produto')
        .insert(complementosInserts)

      if (complError) throw complError
    }

    // 7. ESTRATÉGIA ON-DEMAND REVALIDATION (Invalidação cirúrgica de cache)
    // Limpa o cache estático gerado do lado do cliente para que o produto apareça no mesmo segundo
    revalidatePath(`/${restaurante.slug}`)

    return { success: true }
  } catch (error: unknown) {
    if (!produtoCriado && caminhoImagemUpload) {
      await supabase.storage
        .from(BUCKET_IMAGENS_PRODUTOS)
        .remove([caminhoImagemUpload])
    }

    const message = getErrorMessage(error)
    console.error('[SERVER ACTION ERROR] Falha ao registrar produto:', error)
    return { success: false, error: message }
  }
}

/**
 * Busca os itens do cardápio de um restaurante específico pelo seu Slug,
 * incluindo a relação de complementos cadastrados (tabela complementos_produto).
 * 
 * @param slug O slug identificador do restaurante na URL (ex: 'burger-house')
 */
export async function obterCardapioPorSlug(slug: string) {
  const supabase = await createClient()
  const slugNormalizado = slug.trim()

  if (!slugNormalizado) {
    return { restaurante: null, produtos: [] }
  }

  // 1. Busca primeiro o ID e nome do restaurante usando o slug da URL
  const { data: restaurante, error: erroRestaurante } = await supabase
    .from('restaurantes')
    .select('id, nome, tipo')
    .eq('slug', slugNormalizado)
    .maybeSingle()

  if (erroRestaurante || !restaurante) {
    console.error('Erro ao localizar restaurante pelo slug:', erroRestaurante)
    return { restaurante: null, produtos: [] }
  }

  // 2. Busca os itens de cardápio do restaurante com JOIN reativo na tabela complementos_produto
  const { data: produtos, error: erroProdutos } = await supabase
    .from('itens_cardapio')
    .select(`
      id,
      restaurante_id,
      nome,
      descricao,
      preco_venda,
      imagem_url,
      disponivel,
      created_at,
      complementos_produto (
        id,
        item_cardapio_id,
        nome,
        preco_adicional,
        disponivel,
        created_at
      )
    `)
    .eq('restaurante_id', restaurante.id)
    .eq('disponivel', true) // Garante que só exibe itens ativos na vitrine pública
    .order('created_at', { ascending: true })

  if (erroProdutos) {
    console.error('Erro ao buscar itens e complementos do cardápio:', erroProdutos)
    return { restaurante, produtos: [] }
  }

  return {
    restaurante,
    produtos: produtos || []
  }
}
