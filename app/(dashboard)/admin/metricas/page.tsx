// app/(dashboard)/admin/metricas/page.tsx
import React from 'react';
import { obterMetricasGrowthDoDia } from '@/actions/adminMetricas';
import { CardsPerformanceGrowth } from '@/components/metricas/CardsPerformanceGrowth';
import { GraficoFunilGrowth } from '@/components/metricas/GraficoFunilGrowth';
import { AdminNavHeader } from '@/components/admin/AdminNavHeader';

export const revalidate = 0; // Desativa cache para garantir dados financeiros frescos em tempo real

export default async function PainelMetricasAdmin() {
  const dadosGrowth = await obterMetricasGrowthDoDia();

  return (
    <div className="min-h-screen bg-[#F3F3F3] text-[#1A1A1A] font-sans antialiased flex items-start justify-center p-4 sm:p-8 md:py-12">
      <div className="w-full max-w-4xl space-y-6">
        
        <AdminNavHeader activeTab="metricas" />

        {/* CARDS COM MÉTRICAS DE ENTRADA E CMV ACUMULADO */}
        <CardsPerformanceGrowth dados={dadosGrowth} />

        {/* GRÁFICO DO FUNIL DE CONVERSÃO DO TRÁFEGO */}
        <GraficoFunilGrowth dados={dadosGrowth} />

      </div>
    </div>
  );
}
