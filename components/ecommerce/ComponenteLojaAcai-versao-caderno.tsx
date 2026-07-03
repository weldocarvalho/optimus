// // components/ecommerce/ComponenteLojaAcai.tsx
// 'use client';

// import React, { useState } from 'react';
// import { CardItemAcai } from './CardItemAcai';
// import BarraCarrinhoFlutuante from './BarraCarrinhoFlutuante';

// interface ProdutoCardapio {
//   id: string;
//   nome: string;
//   descricao: string;
//   preco_venda: number;
//   disponivel: boolean;
// }

// interface ComponenteLojaAcaiProps {
//   restaurante: { id: string; nome: string };
//   produtos: ProdutoCardapio[];
// }

// type CategoriaEmocional = 'TODOS' | 'FITNESS' | 'SOBREMESA' | 'CASA';

// export function ComponenteLojaAcai({ restaurante, produtos }: ComponenteLojaAcaiProps) {
//   const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaEmocional>('TODOS');

//   const produtosFiltrados = produtos.filter((p) => {
//     if (categoriaAtiva === 'TODOS') return true;
//     const desc = (p.descricao || '').toLowerCase();
//     const nome = p.nome.toLowerCase();
    
//     if (categoriaAtiva === 'FITNESS') return desc.includes('whey') || desc.includes('banana') || desc.includes('zero') || desc.includes('amendoim');
//     if (categoriaAtiva === 'SOBREMESA') return desc.includes('creme') || desc.includes('bombom') || desc.includes('condensado') || desc.includes('chocolate');
//     if (categoriaAtiva === 'CASA') return nome.includes('turbinado') || nome.includes('combo') || nome.includes('supremo');
//     return true;
//   });

//   return (
//     // Fundo de mesa escuro fosco de contraste
//     <div className="min-h-screen bg-[#E5E4E2] text-[#1A1A1A] antialiased pb-32 font-sans select-none p-4 sm:p-6 flex justify-center">
      
//       {/* CADERNO BRANCO COM PAUTAS LEVEMENTE ROXAS */}
//       <div 
//         className="w-full max-w-xl border border-zinc-200/80 rounded-[12px] rounded-b-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden"
//         style={{
//           backgroundColor: '#FFFFFF', // Caderno Branco Puro
//           backgroundImage: 'linear-gradient(rgba(59, 13, 44, 0.12) 1px, transparent 1px)', // Linhas Roxo Veludo pálido
//           backgroundSize: '100% 28px',
//           backgroundPosition: '0 160px'
//         }}
//       >
        
//         {/* LINHA DE MARGEM ROXA VERTICAL DE ESCOAMENTO */}
//         <div className="absolute top-0 bottom-0 left-12 w-0.5 bg-purple-200/50 pointer-events-none" />

//         {/* ANÉIS SUTIS DE CADERNO ESPIRAL / DESTAQUE NO TOPO */}
//         <div className="absolute top-0 left-0 right-0 h-4 bg-zinc-100 border-b border-zinc-200 flex justify-between px-6 items-center">
//           <div className="flex gap-1.5">{Array.from({ length: 18 }).map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-[#E5E4E2] shadow-inner" />)}</div>
//         </div>

//         {/* HEADER IMPRESSO */}
//         <header className="flex items-center justify-between border-b-2 border-dashed border-zinc-200 pb-5 mt-4 relative z-10 pl-8">
//           <div className="leading-tight">
//             <h1 className="font-black text-2xl tracking-tight text-[#3B0D2C] uppercase">{restaurante.nome}</h1>
//             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mt-1">AceleraFood Tech</span>
//           </div>
//         </header>

//         {/* MENU DE ABAS DE TEXTO */}
//         <nav className="flex items-center gap-4 overflow-x-auto pb-1 border-b border-zinc-200/60 scrollbar-none text-xs font-bold uppercase tracking-wider relative z-10 pl-8">
//           <button onClick={() => setCategoriaAtiva('TODOS')} className={`pb-2 transition-all ${categoriaAtiva === 'TODOS' ? 'text-[#3B0D2C] border-b-2 border-[#3B0D2C]' : 'text-zinc-400'}`}>Todos</button>
//           <button onClick={() => setCategoriaAtiva('FITNESS')} className={`pb-2 transition-all shrink-0 ${categoriaAtiva === 'FITNESS' ? 'text-[#3B0D2C] border-b-2 border-[#3B0D2C]' : 'text-zinc-400'}`}>Fitness</button>
//           <button onClick={() => setCategoriaAtiva('SOBREMESA')} className={`pb-2 transition-all shrink-0 ${categoriaAtiva === 'SOBREMESA' ? 'text-[#3B0D2C] border-b-2 border-[#3B0D2C]' : 'text-zinc-400'}`}>Sobremesas</button>
//           <button onClick={() => setCategoriaAtiva('CASA')} className={`pb-2 transition-all shrink-0 ${categoriaAtiva === 'CASA' ? 'text-[#3B0D2C] border-b-2 border-[#3B0D2C]' : 'text-zinc-400'}`}>Da Casa</button>
//         </nav>

//         {/* ESTEIRA DE POST-ITS (GRID COM ESPAÇAMENTO RESPIRÁVEL) */}
//         <div className="flex flex-col gap-6 relative z-10 pl-8 pr-2 pt-2">
//           {produtosFiltrados.length === 0 ? (
//             <div className="text-center py-12 text-zinc-400">
//               <p className="font-bold text-xs uppercase tracking-wider">Mural Vazio.</p>
//             </div>
//           ) : (
//             produtosFiltrados.map((produto, index) => (
//               <CardItemAcai key={produto.id} product={produto} index={index} />
//             ))
//           )}
//         </div>

//       </div>

//       <BarraCarrinhoFlutuante ehAcai={true} />
//     </div>
//   );
// }
