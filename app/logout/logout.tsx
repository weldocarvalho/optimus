// app/logout/logout.tsx
import { logout } from '@/actions/auth'

export function BotaoLogout() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-[12px] border border-zinc-200/80 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition-all duration-150 hover:text-[#E16349] hover:border-[#E16349]/30 shadow-sm"
      >
        Encerrar Sessão
      </button>
    </form>
  )
}
