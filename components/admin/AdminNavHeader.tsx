'use client';

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { APP_BRAND_NAME } from '@/utils/branding';
import { BotaoLogout } from '@/app/logout/logout';

type AdminTab = 'produtos' | 'insumos' | 'estoque' | 'cozinha' | 'metricas' | 'pagamentos' | 'ia';

interface AdminNavHeaderProps {
  activeTab: AdminTab;
  brandActions?: ReactNode;
  showAccountActions?: boolean;
}

interface NavItem {
  id: AdminTab;
  href: string;
  label: string;
  icon: ReactNode;
  destaque?: boolean;
}

const navItems: NavItem[] = [
  {
    id: 'produtos',
    href: '/admin/produtos',
    label: 'Cardápio',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'insumos',
    href: '/admin/insumos',
    label: 'Insumos',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: 'estoque',
    href: '/admin/estoque',
    label: 'Estoque (em breve)',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L12 3l9 4.5M3 7.5V16.5L12 21l9-4.5V7.5M3 7.5L12 12m0 9V12m0 0l9-4.5" />
      </svg>
    ),
  },
  {
    id: 'cozinha',
    href: '/admin/cozinha',
    label: 'Cozinha',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: 'metricas',
    href: '/admin/metricas',
    label: 'Métricas',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    id: 'pagamentos',
    href: '/admin/pagamentos',
    label: 'Pagamentos',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M3 6h18a.75.75 0 01.75.75v10.5A2.25 2.25 0 0119.5 19.5h-15A2.25 2.25 0 012.25 17.25V6.75A.75.75 0 013 6z" />
      </svg>
    ),
  },
  {
    id: 'ia',
    href: '/admin/ia',
    label: 'IA Insights',
    destaque: true,
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v4m0 10v4M3 12h4m10 0h4M5.64 5.64l2.83 2.83m7.06 7.06l2.83 2.83m0-12.72l-2.83 2.83m-7.06 7.06l-2.83 2.83" />
      </svg>
    ),
  },
];

export function AdminNavHeader({ activeTab, brandActions, showAccountActions = true }: AdminNavHeaderProps) {
  const inputLogoRef = useRef<HTMLInputElement | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [carregandoLogo, setCarregandoLogo] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);

  useEffect(() => {
    let ativo = true;

    const carregarLogo = async () => {
      setCarregandoLogo(true);
      try {
        const resposta = await fetch('/api/admin/restaurante', { cache: 'no-store' });
        if (!resposta.ok) return;
        const body = await resposta.json();
        if (ativo) {
          setLogoUrl(typeof body?.logo_url === 'string' ? body.logo_url : null);
        }
      } catch (error) {
        console.error('Falha ao carregar logo do restaurante:', error);
      } finally {
        if (ativo) {
          setCarregandoLogo(false);
        }
      }
    };

    void carregarLogo();

    return () => {
      ativo = false;
    };
  }, []);

  const handleSelecionarLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    const formData = new FormData();
    formData.append('logo', arquivo);
    setEnviandoLogo(true);

    try {
      const resposta = await fetch('/api/admin/restaurante/logo', {
        method: 'POST',
        body: formData,
      });
      const body = await resposta.json();

      if (!resposta.ok) {
        throw new Error(body?.error || 'Falha ao atualizar logo.');
      }

      setLogoUrl(body?.logo_url || null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao atualizar logo.');
    } finally {
      setEnviandoLogo(false);
      event.target.value = '';
    }
  };

  const triggerInputLogo = () => {
    inputLogoRef.current?.click();
  };

  return (
    <header className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3.5 select-none">
          <button
            type="button"
            onClick={triggerInputLogo}
            disabled={enviandoLogo || carregandoLogo}
            className="group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200/60 bg-[#F3F3F3] text-zinc-400 shadow-inner disabled:opacity-60"
            title="Editar logo"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Logo do restaurante"
                width={44}
                height={44}
                unoptimized
                className="h-11 w-11 rounded-full object-cover"
              />
            ) : (
              <svg className="h-5 w-5 text-[#E16349]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m0 0a3.001 3.001 0 00-3.75-.615A2.993 2.993 0 009.75 9.75c0 .358.063.702.18 1.025m10.965-1.426c.229-.112.483-.174.75-.174a1.5 1.5 0 011.5 1.5v6.75m-4.5-9a3.97 3.97 0 00-1.22-.112m-1.48 1.137A3.987 3.987 0 0112 11.25c-1.192 0-2.261-.523-3-1.362m-.75 0a3.987 3.987 0 01-3-1.362m0 0a3 3 0 00-3.75.615A2.993 2.993 0 001.5 9.75c0 .358.063.702.18 1.025m0 0A3.987 3.987 0 013 11.25c1.192 0 2.261-.523 3-1.362m0 0c.267.267.58.483.925.64" />
              </svg>
            )}
            {/* Overlay de edição — visível apenas no hover */}
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-zinc-900/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {enviandoLogo ? (
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                </svg>
              )}
            </span>
          </button>
          <input
            ref={inputLogoRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleSelecionarLogo}
          />
          <div className="leading-tight">
            <h2 className="text-lg font-bold tracking-tight text-[#1A1A1A]">{APP_BRAND_NAME}</h2>
            <span className="mt-0.5 block text-[11px] font-semibold tracking-wide text-[#E16349]">Painel Administrativo</span>
          </div>
        </div>

        {showAccountActions ? (
          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700"
              title="Perfil em breve"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 0115 0" />
                </svg>
              </span>
              Perfil (em breve)
            </button>
            <BotaoLogout />
            {brandActions}
          </div>
        ) : (
          brandActions
        )}
      </div>

      <nav className="mt-4 flex items-center gap-1 overflow-x-auto rounded-2xl bg-[#F3F3F3] p-1.5">
        {navItems.map((item) => {
          const isActive = item.id === activeTab;
          const className = isActive
            ? 'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#E16349] text-white shadow-sm transition-all shrink-0'
            : item.destaque
              ? 'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all shrink-0 hover:bg-emerald-200'
              : 'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-[#1A1A1A] transition-all shrink-0';

          const iconClassName = isActive ? '' : 'text-zinc-400';

          return (
            <Link key={item.id} href={item.href} className={className}>
              <span className={iconClassName}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
