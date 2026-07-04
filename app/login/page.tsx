import { Suspense } from 'react'
import { FormLogin } from './form-cliente'

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full bg-[#F8F8F8] text-[#1A1A1A] flex items-center justify-center p-6 md:p-12 font-sans selection:bg-[#E16349] selection:text-white">
      {/* Container Principal em Grade Bento */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Bloco 1 (Esquerda): Proposta de Valor do SaaS (Ocupa 7 colunas) */}
        <div className="md:col-span-7 rounded-[32px] bg-[#F3F3F3] p-8 md:p-12 flex flex-col justify-between border border-[#E1E1E1] min-h-[320px] md:min-h-[500px]">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-[#E16349] font-bold block mb-4">
              Intelligence System v1.0
            </span>
            <h1 className="text-3xl md:text-4xl font-light tracking-tight text-[#1A1A1A] leading-[1.15] max-w-md">
              O controle atômico da sua <span className="font-medium text-black">lucratividade real</span>.
            </h1>
          </div>
          
          <div className="grid grid-cols-2 gap-6 pt-8 border-t border-[#E1E1E1]">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">Métricas Directas</p>
              <p className="text-sm font-normal text-[#1A1A1A]">Cruzamento automatizado de CPA (Meta Ads) com CMV real.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">Velocidade Absoluta</p>
              <p className="text-sm font-normal text-[#1A1A1A]">Arquitetura estática rodando sobre infraestrutura isolada.</p>
            </div>
          </div>
        </div>

        {/* Bloco 2 (Direita): Quadrante de Autenticação Neomórfico (Ocupa 5 colunas) */}
        <div className="md:col-span-5 rounded-[32px] bg-[#F8F8F8] p-8 md:p-10 flex flex-col justify-center border border-white shadow-[6px_6px_20px_rgba(0,0,0,0.03),_-6px_-6px_20px_rgba(255,255,255,0.8)]">
          <div className="mb-8">
            <h2 className="text-xl font-medium tracking-tight text-black mb-1">
              Painel do Gestor
            </h2>
            <p className="text-xs text-gray-500 tracking-wide">
              Insira suas credenciais para acessar o terminal.
            </p>
          </div>

          <Suspense fallback={<div className="text-xs text-center text-gray-400">Iniciando canais de segurança...</div>}>
            <FormLogin />
          </Suspense>

          <div className="mt-8 text-center">
            <a href="#" className="text-[11px] uppercase tracking-widest text-gray-400 hover:text-[#E16349] transition-colors duration-200">
              Recuperar credenciais de acesso
            </a>
          </div>
        </div>

      </div>
    </main>
  )
}
