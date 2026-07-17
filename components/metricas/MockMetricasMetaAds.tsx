'use client';

export function MockMetricasMetaAds() {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4">
        <h3 className="text-base font-bold uppercase tracking-wider text-[#1A1A1A]">
          Meta Ads (mock)
        </h3>
        <p className="mt-0.5 text-[11px] font-medium text-zinc-500">
          Visão rápida dos principais indicadores de mídia paga.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Impressões</div>
          <div className="mt-1 text-lg font-bold text-zinc-900">124.300</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Cliques</div>
          <div className="mt-1 text-lg font-bold text-zinc-900">4.280</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">CTR</div>
          <div className="mt-1 text-lg font-bold text-zinc-900">3,44%</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">CPC médio</div>
          <div className="mt-1 text-lg font-bold text-zinc-900">R$ 1,17</div>
        </div>
      </div>
    </section>
  );
}
