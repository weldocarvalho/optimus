'use client'

import { useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import { login } from '@/actions/auth'

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

  return (
    <form action={login} className="space-y-6">
      {erro && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium tracking-wide text-center">
          {erro}
        </div>
      )}

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
  )
}
