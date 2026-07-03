// components/ecommerce/CardItemCardapio.tsx
'use client';

import { ItemCardapio } from '@/types/database';
import { useCarrinho } from './ContextoCarrinho';

interface CardProps {
  produto: ItemCardapio;
  ehAcai: boolean;
}

export default function CardItemCardapio({ produto, ehAcai }: CardProps) {
  const { adicionarItem, itens, removerItem } = useCarrinho();
  
  const itemNoCarrinho = itens.find(i => i.produto.id === produto.id);
  const qtd = itemNoCarrinho?.quantidade || 0;

  // ENGENHARIA DE ESTILOS CAMALEÃO (BENTO PREMIUM)
  // Se for Açaí, aplica o Roxo Veludo. Se não, mantém as cores base.
  const corBotaoMais = ehAcai ? 'bg-[#3B0D2C] hover:bg-[#2C0A25]' : 'bg-[#E16349] hover:bg-[#c8523a]';
  const corBotaoAdicionar = ehAcai ? 'bg-[#3B0D2C] hover:bg-[#2C0A25]' : 'bg-zinc-950 hover:bg-zinc-800';
  const corFundoThumbnail = ehAcai ? 'bg-[#7D1A52]/5 text-[#3B0D2C]' : 'text-amber-600 bg-amber-50';

  return (
    <div className="bg-white border border-zinc-200/50 rounded-[24px] p-4 flex gap-4 shadow-sm shadow-zinc-200/40 items-center hover:border-zinc-300/80 transition-all select-none">
      
      {/* Thumbnail Estilizada */}
      <div className={`w-20 h-20 rounded-[18px] flex items-center justify-center flex-shrink-0 text-3xl shadow-inner ${corFundoThumbnail}`}>
        {ehAcai ? '🍧' : '🍔'}
      </div>

      {/* Detalhes do Produto */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-zinc-950 truncate text-sm sm:text-base leading-tight">
          {produto.nome}
        </h3>
        <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2 leading-relaxed font-medium">
          {produto.descricao || 'Sem descrição disponível.'}
        </p>
        
        <div className="flex items-center justify-between mt-3.5">
          <span className="font-black text-emerald-600 text-sm sm:text-base">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(produto.preco_venda))}
          </span>

          {/* Seletores Reativos com Adaptação de Paleta */}
          {qtd > 0 ? (
            <div className="flex items-center bg-[#F3F3F3] rounded-xl p-1 gap-3 border border-zinc-200/20">
              <button 
                onClick={() => removerItem(produto.id)} 
                className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-xs font-black text-zinc-600 hover:bg-zinc-100 shadow-sm"
              >
                -
              </button>
              <span className="text-xs font-bold px-0.5 text-zinc-800">{qtd}</span>
              <button 
                onClick={() => adicionarItem(produto)} 
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-sm transition-colors ${corBotaoMais}`}
              >
                +
              </button>
            </div>
          ) : (
            <button 
              onClick={() => adicionarItem(produto)}
              className={`text-white font-bold text-xs px-4 py-2 rounded-xl active:scale-95 transition-all shadow-sm ${corBotaoAdicionar}`}
            >
              Adicionar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
