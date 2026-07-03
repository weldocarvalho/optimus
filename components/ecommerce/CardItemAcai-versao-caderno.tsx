// // components/ecommerce/CardItemAcai.tsx
// 'use client';

// import React from 'react';
// import { useCarrinho } from './ContextoCarrinho';
// import { ItemCardapio } from '@/types/database';

// interface ProdutoAcai {
//   id: string;
//   nome: string;
//   descricao: string;
//   preco_venda: number;
//   disponivel: boolean;
// }

// interface CardItemAcaiProps {
//   product: ProdutoAcai;
//   index?: number; // Index opcional para orquestrar as cores e rotações dos Post-its
// }

// export function CardItemAcai({ product, index = 0 }: CardItemAcaiProps) {
//   const { adicionarItem, itens, removerItem } = useCarrinho();

//   const produtoNormalizado: ItemCardapio = {
//     id: product.id, restaurante_id: '', nome: product.nome, descricao: product.descricao,
//     preco_venda: product.preco_venda, disponivel: product.disponivel, imagem_url: '',
//     created_at: new Date().toISOString()
//   };

//   const itemNoCarrinho = itens.find(i => i.produto.id === product.id);
//   const qtd = itemNoCarrinho?.quantidade || 0;

//   const isQueridinho = product.nome.includes('Turbinado') || product.nome.includes('Kilo');

//   // DISTRIBUIÇÃO DINÂMICA DE CORES PASTÉIS DE POST-IT
//   const obterCorPostIt = (idx: number) => {
//     const cores = [
//       'bg-[#FEF9E7] border-[#F9E79F]', // Amarelo Canário Pálido
//       'bg-[#EAF2EC] border-[#C8DCCE]', // Verde Menta Suave
//       'bg-[#FCECE9] border-[#F4CDA5]', // Rosa Giz Esmaecido
//       'bg-[#EBF1F5] border-[#BFCFDB]'  // Azul Pálido
//     ];
//     return cores[idx % cores.length];
//   };

//   // ROTATIVIDADE ASSIMÉTRICA: Simula a colagem humana desalinhada
//   const obterRotacaoPostIt = (idx: number) => {
//     const rotacoes = ['rotate-[1deg]', 'rotate-[-1deg]', 'rotate-[1.5deg]', 'rotate-[-1.5deg]'];
//     return rotacoes[idx % rotacoes.length];
//   };

//   return (
//     // POST-IT FISICO: Caixa quadrada, bordas semirrígidas, fita colante simulada no topo e sombra deslocada para a base
//     <div 
//       className={`w-full ${obterCorPostIt(index)} ${obterRotacaoPostIt(index)} border-t-[14px] border-t-black/5 border-l border-r border-b border-zinc-300/60 p-5 flex flex-col gap-4 shadow-[3px_8px_15px_rgba(0,0,0,0.08)] hover:rotate-0 hover:scale-[1.02] hover:shadow-[5px_12px_22px_rgba(0,0,0,0.12)] transition-all duration-200 relative`}
//     >
      
//       {/* MARCADOR DE DESTAQUE INTERNO */}
//       {isQueridinho && (
//         <span className="absolute top-2 right-4 text-[8px] font-black uppercase tracking-widest text-[#3B0D2C] bg-white/60 border border-[#3B0D2C]/10 px-1.5 py-0.5 rounded-sm">
//           Favorito
//         </span>
//       )}

//       {/* BLOCO DE CONTEÚDO DO TIPO NOTA RAPIDA */}
//       <div className="flex-1 min-w-0">
//         <h3 className="font-black text-zinc-900 tracking-tight text-base sm:text-lg leading-tight">
//           {product.nome}
//         </h3>
//         <p className="text-zinc-600/90 text-xs mt-2 leading-relaxed font-bold">
//           {product.descricao || 'Fórmula artesanal montada com insumos selecionados.'}
//         </p>
//       </div>

//       {/* RODAPÉ DO POST-IT: VALORES E INTERATIVIDADE REATIVA */}
//       <div className="flex items-center justify-between mt-1 pt-2 border-t border-black/5">
//         <span className="font-black text-[#3B0D2C] text-base font-mono">
//           {product.preco_venda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
//         </span>

//         {qtd > 0 ? (
//           <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-[10px] p-0.5 gap-2 border border-black/5 shadow-sm">
//             <button onClick={() => removerItem(product.id)} className="w-5 h-5 rounded-[6px] bg-white flex items-center justify-center text-[10px] font-black text-zinc-600 shadow-sm">-</button>
//             <span className="text-xs font-black px-0.5 text-zinc-800 font-mono">{qtd}</span>
//             <button onClick={() => adicionarItem(produtoNormalizado)} className="w-5 h-5 rounded-[6px] bg-[#3B0D2C] flex items-center justify-center text-[10px] font-black text-white shadow-sm">+</button>
//           </div>
//         ) : (
//           <button 
//             onClick={() => adicionarItem(produtoNormalizado)}
//             className="text-white bg-[#3B0D2C] hover:bg-[#2C0A25] font-black text-[10px] px-3.5 py-2 rounded-[10px] transition-all uppercase tracking-widest shadow-sm"
//           >
//             Adicionar
//           </button>
//         )}
//       </div>

//     </div>
//   );
// }
