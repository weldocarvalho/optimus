'use client'

import { useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import { login, solicitarLinkMagico } from '@/actions/auth'

function BotaoSubmit() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-4 px-6 rounded-2xl bg-[#E16349] text-white font-medium tracking-wide transition-all duration-300 shadow-[0_4px_12px_rgba(225,99,73,0.2)] hover:shadow-[0_6px_20px_rgba(225,99,73,0.3)] hover:bg-[#d0553b] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-sm uppercase"
    >
      {pending ? 'Autenticando...' : 'Acessar Centro de Comando'}
    </button>
  )
}

export function FormLogin() {
  const searchParams = useSearchParams()
  const erro = searchParams.get('error')
  const status = searchParams.get('status')

  return (
    <div className="space-y-6">
      {erro && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium tracking-wide text-center">
          {erro}
        </div>
      )}

      {status === 'link-magico-enviado' && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium tracking-wide text-center">
          Link mágico enviado. Verifique seu e-mail.
        </div>
      )}

      <form action={login} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-[#1A1A1A] font-semibold block">
            E-mail Corporativo
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="gestor@restaurante.com"
            className="w-full px-5 py-4 rounded-2xl bg-[#F3F3F3] text-[#1A1A1A] text-sm font-normal border border-[#E1E1E1] focus:border-[#E16349] focus:bg-white outline-none transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-[#1A1A1A] font-semibold block">
            Senha de Acesso
          </label>
          <input
            type="password"
            name="password"
            required
            placeholder="••••••••"
            className="w-full px-5 py-4 rounded-2xl bg-[#F3F3F3] text-[#1A1A1A] text-sm font-normal border border-[#E1E1E1] focus:border-[#E16349] focus:bg-white outline-none transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
          />
        </div>

        <div className="pt-2">
          <BotaoSubmit />
        </div>
      </form>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E1E1E1]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#F8F8F8] px-3 text-[10px] uppercase tracking-widest text-gray-400">ou</span>
        </div>
      </div>

      <form action={solicitarLinkMagico} className="space-y-3">
        <label className="text-xs uppercase tracking-widest text-[#1A1A1A] font-semibold block">
          Entrar com link mágico
        </label>
        <input
          type="email"
          name="email"
          required
          placeholder="gestor@restaurante.com"
          className="w-full px-5 py-4 rounded-2xl bg-[#F3F3F3] text-[#1A1A1A] text-sm font-normal border border-[#E1E1E1] focus:border-[#E16349] focus:bg-white outline-none transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
        />
        <button
          type="submit"
          className="w-full py-4 px-6 rounded-2xl border border-[#E16349]/40 bg-white text-[#E16349] font-semibold tracking-wide transition-all duration-300 hover:bg-[#fff6f4] text-sm uppercase"
        >
          Receber link de acesso por e-mail
        </button>
      </form>
    </div>
  )
}
