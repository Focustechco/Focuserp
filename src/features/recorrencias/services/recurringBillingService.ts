import { TituloReceber } from '@/features/contas-receber/types';
import { RecorrenciaFinanceira, FrequenciaRecorrencia } from '../types';
import { getBrasiliaTodayIso, parseDateSafe } from '@/lib/dateUtils';
import { supabase } from '@/lib/supabaseClient';

/**
 * Interface para parâmetros de baixa de título financeiro
 */
export interface BaixaTituloPayload {
  tituloId: string;
  valorRecebido?: number;
  dataRecebimento?: string;
  formaPagamento?: string;
  contaBancaria?: string;
  desconto?: number;
  multa?: number;
  juros?: number;
  observacoes?: string;
  usuario?: string;
}

/**
 * Retorna se o ano é bissexto
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Retorna o último dia de um mês específico respeitando anos bissextos
 */
export function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Retorna um dia seguro para o mês (ex: dia 31 em fevereiro vira 28 ou 29)
 */
export function getSafeDayInMonth(year: number, month: number, desiredDay: number): number {
  const lastDay = getLastDayOfMonth(year, month);
  return Math.min(Math.max(1, desiredDay), lastDay);
}

/**
 * Formata competência contábil (MM/YYYY)
 */
export function formatCompetencia(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${m}/${y}`;
}

/**
 * Retorna a chave de período de referência para idempotência (YYYY-MM)
 */
export function getReferencePeriod(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${y}-${m}`;
}

/**
 * Calcula a próxima data de vencimento a partir de uma data base e frequência
 */
export function calculateNextDueDate(
  baseDate: Date,
  frequency: FrequenciaRecorrencia,
  dueDay: number,
  step = 1
): Date {
  const next = new Date(baseDate);
  const currentMonth = next.getMonth();
  const currentYear = next.getFullYear();

  switch (frequency) {
    case 'Semanal': {
      next.setDate(next.getDate() + 7 * step);
      return next;
    }
    case 'Quinzenal': {
      next.setDate(next.getDate() + 15 * step);
      return next;
    }
    case 'Mensal': {
      const targetMonth = currentMonth + step;
      const targetYear = currentYear + Math.floor(targetMonth / 12);
      const normalizedMonth = ((targetMonth % 12) + 12) % 12;
      const safeDay = getSafeDayInMonth(targetYear, normalizedMonth, dueDay);
      return new Date(targetYear, normalizedMonth, safeDay);
    }
    case 'Trimestral': {
      const targetMonth = currentMonth + (3 * step);
      const targetYear = currentYear + Math.floor(targetMonth / 12);
      const normalizedMonth = ((targetMonth % 12) + 12) % 12;
      const safeDay = getSafeDayInMonth(targetYear, normalizedMonth, dueDay);
      return new Date(targetYear, normalizedMonth, safeDay);
    }
    case 'Semestral': {
      const targetMonth = currentMonth + (6 * step);
      const targetYear = currentYear + Math.floor(targetMonth / 12);
      const normalizedMonth = ((targetMonth % 12) + 12) % 12;
      const safeDay = getSafeDayInMonth(targetYear, normalizedMonth, dueDay);
      return new Date(targetYear, normalizedMonth, safeDay);
    }
    case 'Anual': {
      const targetYear = currentYear + step;
      const safeDay = getSafeDayInMonth(targetYear, currentMonth, dueDay);
      return new Date(targetYear, currentMonth, safeDay);
    }
    default: {
      const targetMonth = currentMonth + step;
      const targetYear = currentYear + Math.floor(targetMonth / 12);
      const normalizedMonth = ((targetMonth % 12) + 12) % 12;
      const safeDay = getSafeDayInMonth(targetYear, normalizedMonth, dueDay);
      return new Date(targetYear, normalizedMonth, safeDay);
    }
  }
}

/**
 * Converte data ISO string 'YYYY-MM-DD' de forma segura
 */
export function formatIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * SERVIÇO DE DOMÍNIO DE RECORRÊNCIA E FATURAMENTO AUTOMATIZADO (Focus ERP)
 * 
 * Regras Centrais:
 * 1. O contrato recorrente representa uma programação de cobrança futura.
 * 2. Ao criar a recorrência, gera APENAS o 1º título vigente do ciclo atual com status 'Pendente'.
 * 3. O saldo em caixa e as receitas realizadas permanecem R$ 0,00 até a baixa efetiva do título.
 * 4. Idempotência absoluta: impede duplicidade de títulos para a mesma competência/recorrência.
 */
export const recurringBillingService = {
  /**
   * Determina a data de vencimento do ciclo corrente da recorrência
   */
  getFirstDueDate(recorrencia: RecorrenciaFinanceira): Date {
    const dueDay = Math.min(31, Math.max(1, recorrencia.diaVencimento || 10));
    const dataInicio = recorrencia.dataInicio ? parseDateSafe(recorrencia.dataInicio) : new Date();
    
    // Se foi fornecida explicitamente a data da próxima cobrança
    if (recorrencia.proximaCobranca) {
      return parseDateSafe(recorrencia.proximaCobranca);
    }

    const startYear = dataInicio.getFullYear();
    const startMonth = dataInicio.getMonth();
    const startDay = dataInicio.getDate();

    // Se o dia de vencimento for maior ou igual ao dia de início, vence no próprio mês de início
    if (dueDay >= startDay) {
      const safeDay = getSafeDayInMonth(startYear, startMonth, dueDay);
      return new Date(startYear, startMonth, safeDay);
    }

    // Caso contrário, vence no mês subsequente
    return calculateNextDueDate(new Date(startYear, startMonth, 1), recorrencia.frequencia || 'Mensal', dueDay, 1);
  },

  /**
   * Gera o título do ciclo vigente com garantia de idempotência e status Pendente
   */
  generateCurrentCycleTitle(
    recorrencia: RecorrenciaFinanceira,
    existingTitles: TituloReceber[] = []
  ): { title: TituloReceber | null; updatedList: TituloReceber[]; isNew: boolean } {
    if (!recorrencia || !recorrencia.clientId || recorrencia.status !== 'Ativa') {
      return { title: null, updatedList: existingTitles, isNew: false };
    }

    const firstDueDate = this.getFirstDueDate(recorrencia);
    const dueDateIso = formatIsoDate(firstDueDate);
    const refPeriod = getReferencePeriod(firstDueDate);
    const competencia = formatCompetencia(firstDueDate);
    const hoje = getBrasiliaTodayIso();

    // Verificar se já existe título desta recorrência nesta competência (Idempotência)
    const existingIndex = existingTitles.findIndex(t => {
      const matchRecId = t.recorrenciaId === recorrencia.id;
      const matchClientAndDate = (t.clienteId === recorrencia.clientId || t.cliente === recorrencia.clienteNome) && 
                                 (t.dataVencimento === dueDateIso || (t as any).competencia === competencia);
      return matchRecId || matchClientAndDate;
    });

    if (existingIndex >= 0) {
      const existing = existingTitles[existingIndex];
      // Título já existente: não duplicar, apenas atualizar se ainda estiver aberto
      if (existing.status !== 'Recebido' && existing.status !== 'Cancelado') {
        const isPastDue = dueDateIso < hoje;
        const currentStatus = isPastDue ? 'Atrasado' : 'Pendente';

        const updated: TituloReceber = {
          ...existing,
          cliente: recorrencia.clienteNome,
          clienteId: recorrencia.clientId,
          recorrenciaId: recorrencia.id,
          descricao: recorrencia.descricao || 'Consultoria Mensal Focus',
          valorOriginal: Number(recorrencia.valor) || 0,
          saldo: Math.max(0, Number(recorrencia.valor) - (existing.valorRecebido || 0)),
          status: existing.status === 'Recebido Parcialmente' ? 'Recebido Parcialmente' : currentStatus,
          formaPagamento: recorrencia.formaPagamento || existing.formaPagamento || 'PIX',
          ultimaAtualizacao: new Date().toISOString(),
        };

        const copy = [...existingTitles];
        copy[existingIndex] = updated;
        return { title: updated, updatedList: copy, isNew: false };
      }
      return { title: existing, updatedList: existingTitles, isNew: false };
    }

    // Criar o PRIMEIRO título com status PENDENTE / EM ABERTO
    const isPastDue = dueDateIso < hoje;
    const initialStatus = isPastDue ? 'Atrasado' : 'Pendente';
    const valorOriginal = Number(recorrencia.valor) || 0;

    const novoTitulo: TituloReceber = {
      id: crypto.randomUUID(),
      numero: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      cliente: recorrencia.clienteNome,
      clienteId: recorrencia.clientId,
      recorrenciaId: recorrencia.id,
      origem: 'recorrencia',
      descricao: recorrencia.descricao || 'Consultoria Mensal Focus',
      categoria: recorrencia.categoria || 'Receita Operacional',
      valorOriginal: valorOriginal,
      valorRecebido: 0,
      saldo: valorOriginal,
      dataEmissao: hoje,
      dataVencimento: dueDateIso,
      formaPagamento: recorrencia.formaPagamento || 'PIX',
      status: initialStatus,
      responsavel: 'Financeiro',
      ultimaAtualizacao: new Date().toISOString(),
      recorrente: true,
      recorrenciaFrequencia: recorrencia.frequencia || 'Mensal',
      historico: [
        {
          id: `h-${Date.now()}`,
          data: new Date().toISOString(),
          usuario: 'Sistema',
          acao: 'Geração do Título do Ciclo Vigente',
          observacao: `Título gerado a partir do contrato recorrente "${recorrencia.descricao}". Competência: ${competencia}. Status inicial: ${initialStatus}.`
        }
      ]
    };

    const updatedList = [novoTitulo, ...existingTitles];
    return { title: novoTitulo, updatedList, isNew: true };
  },

  /**
   * Realiza a baixa / recebimento transacional de um título financeiro
   */
  async baixarTituloTransacional(
    titulo: TituloReceber,
    payload: Partial<BaixaTituloPayload> = {}
  ): Promise<TituloReceber> {
    const hoje = getBrasiliaTodayIso();
    const dataRecebimento = payload.dataRecebimento || hoje;
    const valorOriginal = Number(titulo.valorOriginal || 0);
    const desconto = Number(payload.desconto || 0);
    const multa = Number(payload.multa || 0);
    const juros = Number(payload.juros || 0);
    const valorTotalDevido = valorOriginal - desconto + multa + juros;

    const valorRecebido = payload.valorRecebido !== undefined 
      ? Number(payload.valorRecebido) 
      : valorTotalDevido;

    const novoTotalRecebido = (Number(titulo.valorRecebido) || 0) + valorRecebido;
    const novoSaldo = Math.max(0, valorTotalDevido - novoTotalRecebido);
    const novoStatus = novoSaldo === 0 ? 'Recebido' : 'Recebido Parcialmente';

    const tituloAtualizado: TituloReceber = {
      ...titulo,
      valorOriginal,
      valorRecebido: novoTotalRecebido,
      saldo: novoSaldo,
      dataRecebimento: novoStatus === 'Recebido' ? dataRecebimento : titulo.dataRecebimento,
      formaPagamento: payload.formaPagamento || titulo.formaPagamento || 'PIX',
      status: novoStatus,
      ultimaAtualizacao: new Date().toISOString(),
      historico: [
        ...(Array.isArray(titulo.historico) ? titulo.historico : []),
        {
          id: `h-baixa-${Date.now()}`,
          data: new Date().toISOString(),
          usuario: payload.usuario || 'Financeiro',
          acao: novoStatus === 'Recebido' ? 'Baixa Total de Título' : 'Baixa Parcial de Título',
          observacao: `Recebimento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorRecebido)} registrado via ${payload.formaPagamento || 'PIX'}. Saldo remanescente: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(novoSaldo)}.`
        }
      ]
    };

    // Gravar no Supabase / PostgreSQL de forma atômica
    try {
      await supabase.from('contas_receber').upsert({
        id: tituloAtualizado.id,
        numero: tituloAtualizado.numero,
        cliente_nome: tituloAtualizado.cliente,
        cliente_id: tituloAtualizado.clienteId || null,
        descricao: tituloAtualizado.descricao,
        categoria: tituloAtualizado.categoria || 'Receita Operacional',
        valor_original: tituloAtualizado.valorOriginal,
        valor_recebido: tituloAtualizado.valorRecebido,
        saldo: tituloAtualizado.saldo,
        data_emissao: tituloAtualizado.dataEmissao,
        data_vencimento: tituloAtualizado.dataVencimento,
        data_recebimento: tituloAtualizado.dataRecebimento,
        forma_pagamento: tituloAtualizado.formaPagamento,
        status: tituloAtualizado.status,
        responsavel: tituloAtualizado.responsavel,
        updated_at: new Date().toISOString(),
      });
    } catch (e: any) {
      console.warn('[recurringBillingService.baixarTituloTransacional] Upsert warning:', e?.message);
    }

    return tituloAtualizado;
  }
};
