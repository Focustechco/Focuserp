/**
 * Utilitários de Data com Fuso Horário de Brasília (America/Sao_Paulo / UTC-3).
 * Evita o clássico problema de fuso onde "2026-08-10" vira "2026-08-09" por parsing em UTC 00:00.
 */

// Obter a data atual no fuso de Brasília em formato YYYY-MM-DD
export function getBrasiliaTodayIso(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // Ex: "2026-08-22"
}

// Obter timestamp/ISO string atual no fuso de Brasília
export function getBrasiliaNowIso(): string {
  return new Date().toISOString();
}

/**
 * Converte com segurança uma string de data (YYYY-MM-DD ou ISO) em um objeto Date
 * no meio do dia local (12:00:00) para evitar deslocamento de dia por fuso horário.
 */
export function parseDateSafe(dateVal: string | Date | null | undefined): Date {
  if (!dateVal) return new Date();
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? new Date() : dateVal;

  const str = String(dateVal).trim();
  if (!str) return new Date();

  // Se for apenas YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  // Se contiver 'T' mas for formato ISO com data
  if (str.includes('T')) {
    const datePart = str.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [year, month, day] = datePart.split('-').map(Number);
      return new Date(year, month - 1, day, 12, 0, 0);
    }
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Formata para exibição em pt-BR (DD/MM/YYYY) sem voltar 1 dia
 */
export function formatDateBrasilia(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return '-';
  try {
    const str = String(dateVal).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-');
      return `${d}/${m}/${y}`;
    }
    const d = parseDateSafe(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateVal);
  }
}

/**
 * Formata para exibição com data e hora no padrão brasileiro (Horário de Brasília)
 */
export function formatDateTimeBrasilia(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return '-';
  try {
    const d = parseDateSafe(dateVal);
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return formatDateBrasilia(dateVal);
  }
}

/**
 * Compara se duas datas correspondem ao mesmo dia no fuso de Brasília
 */
export function isSameDayBrasilia(dateA: string | Date, dateB: string | Date): boolean {
  const da = parseDateSafe(dateA);
  const db = parseDateSafe(dateB);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}
