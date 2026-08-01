export interface HorarioFuncionamentoDia {
  dia: number; // 0 = domingo ... 6 = sábado (igual a Date.getDay())
  ativo: boolean; // false = fechado o dia inteiro
  abertura: string; // "HH:MM", 24h
  fechamento: string; // "HH:MM", 24h — pode ser menor que abertura (fecha depois da meia-noite)
}

export const NOMES_DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
] as const;

export const HORARIOS_PADRAO_FORM: HorarioFuncionamentoDia[] = Array.from({ length: 7 }, (_, dia) => ({
  dia,
  ativo: true,
  abertura: '08:00',
  fechamento: '22:00',
}));

const FUSO_HORARIO_LOJA = 'America/Sao_Paulo';

function converterMinutos(horaMinuto: string): number {
  const [horas, minutos] = horaMinuto.split(':').map(Number);
  return horas * 60 + minutos;
}

/** Dia da semana (0-6) e minutos desde a meia-noite, no fuso horário de Brasília — sem depender de biblioteca externa. */
function obterDiaEHoraAtualBrasilia(agora: Date): { dia: number; minutos: number } {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSO_HORARIO_LOJA,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(agora);

  const mapaDias: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const diaAbreviado = partes.find((p) => p.type === 'weekday')?.value ?? 'Sun';
  const hora = Number(partes.find((p) => p.type === 'hour')?.value ?? '0');
  const minuto = Number(partes.find((p) => p.type === 'minute')?.value ?? '0');

  return { dia: mapaDias[diaAbreviado] ?? 0, minutos: hora * 60 + minuto };
}

function dentroDaJanela(minutosAgora: number, abertura: string, fechamento: string): boolean {
  const inicio = converterMinutos(abertura);
  const fim = converterMinutos(fechamento);

  if (fim <= inicio) {
    // Vira a meia-noite (ex.: abre 18:00, fecha 02:00): está aberto se já
    // passou da abertura de hoje OU ainda não chegou no fechamento (que é
    // "amanhã" na prática).
    return minutosAgora >= inicio || minutosAgora < fim;
  }

  return minutosAgora >= inicio && minutosAgora < fim;
}

/**
 * `horarios` nulo/vazio = loja sempre aberta (comportamento padrão até o
 * lojista configurar algo — nenhuma loja existente é bloqueada à toa).
 */
export function estaLojaAberta(horarios: HorarioFuncionamentoDia[] | null | undefined, agora = new Date()): boolean {
  if (!horarios || horarios.length === 0) {
    return true;
  }

  const { dia, minutos } = obterDiaEHoraAtualBrasilia(agora);
  const diaAnterior = (dia + 6) % 7;

  const horarioHoje = horarios.find((h) => h.dia === dia);
  if (horarioHoje?.ativo && dentroDaJanela(minutos, horarioHoje.abertura, horarioHoje.fechamento)) {
    return true;
  }

  // Cobre o caso de um horário de ontem que vira a meia-noite (ex.: sábado
  // abre 18h fecha 02h — à 01h de domingo ainda deve estar aberto, mesmo
  // que domingo esteja marcado como fechado).
  const horarioOntem = horarios.find((h) => h.dia === diaAnterior);
  if (horarioOntem?.ativo) {
    const inicioOntem = converterMinutos(horarioOntem.abertura);
    const fimOntem = converterMinutos(horarioOntem.fechamento);
    if (fimOntem <= inicioOntem && minutos < fimOntem) {
      return true;
    }
  }

  return false;
}
