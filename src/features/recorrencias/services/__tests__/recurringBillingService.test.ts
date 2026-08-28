import { describe, it, expect, beforeEach } from 'vitest';
import {
  recurringBillingService,
  isLeapYear,
  getLastDayOfMonth,
  getSafeDayInMonth,
  calculateNextDueDate,
  formatCompetencia,
  getReferencePeriod,
} from '../recurringBillingService';
import { RecorrenciaFinanceira } from '../../types';
import { TituloReceber } from '@/features/contas-receber/types';

describe('RecurringBillingService & Financial Engine Tests', () => {
  const mockRecorrencia: RecorrenciaFinanceira = {
    id: 'rec-test-001',
    clientId: 'cli-001',
    clienteNome: 'Empresa ABC',
    descricao: 'Consultoria Mensal Focus',
    valor: 12000,
    frequencia: 'Mensal',
    dataInicio: '2026-08-28',
    proximaCobranca: '2026-09-10',
    diaVencimento: 10,
    status: 'Ativa',
    criadoEm: '2026-08-28T10:00:00.000Z',
    atualizadoEm: '2026-08-28T10:00:00.000Z',
  };

  it('1. Deve criar recorrência e gerar APENAS o 1º título vigente do ciclo atual', () => {
    const existingTitles: TituloReceber[] = [];
    const { title, updatedList, isNew } = recurringBillingService.generateCurrentCycleTitle(
      mockRecorrencia,
      existingTitles
    );

    expect(isNew).toBe(true);
    expect(title).not.toBeNull();
    expect(title?.cliente).toBe('Empresa ABC');
    expect(title?.valorOriginal).toBe(12000);
    expect(title?.valorRecebido).toBe(0);
    expect(title?.saldo).toBe(12000);
    expect(title?.status).toBe('Pendente');
    expect(updatedList.length).toBe(1);
  });

  it('2. Garantir que o título gerado esteja PENDENTE e NÃO como Recebido', () => {
    const { title } = recurringBillingService.generateCurrentCycleTitle(mockRecorrencia, []);
    expect(title?.status).not.toBe('Recebido');
    expect(title?.status).not.toBe('Liquidado');
    expect(title?.status).not.toBe('Pago');
    expect(title?.status).toBe('Pendente');
  });

  it('3. Garantir idempotência: Executar a geração duas vezes NÃO duplica títulos', () => {
    const firstRun = recurringBillingService.generateCurrentCycleTitle(mockRecorrencia, []);
    expect(firstRun.updatedList.length).toBe(1);

    // Segunda execução com a mesma lista de títulos
    const secondRun = recurringBillingService.generateCurrentCycleTitle(
      mockRecorrencia,
      firstRun.updatedList
    );

    expect(secondRun.isNew).toBe(false);
    expect(secondRun.updatedList.length).toBe(1);
    expect(secondRun.title?.id).toBe(firstRun.title?.id);
  });

  it('4. Realizar a baixa do título altera o status para Recebido e zera o saldo', async () => {
    const { title } = recurringBillingService.generateCurrentCycleTitle(mockRecorrencia, []);
    expect(title).not.toBeNull();

    const tituloBaixado = await recurringBillingService.baixarTituloTransacional(title!, {
      valorRecebido: 12000,
      dataRecebimento: '2026-09-10',
      formaPagamento: 'PIX',
      usuario: 'Financeiro Admin',
    });

    expect(tituloBaixado.status).toBe('Recebido');
    expect(tituloBaixado.valorRecebido).toBe(12000);
    expect(tituloBaixado.saldo).toBe(0);
    expect(tituloBaixado.dataRecebimento).toBe('2026-09-10');
    expect(tituloBaixado.historico?.length).toBeGreaterThan(0);
  });

  it('5. Testar baixa parcial de título financeiro', async () => {
    const { title } = recurringBillingService.generateCurrentCycleTitle(mockRecorrencia, []);

    const tituloParcial = await recurringBillingService.baixarTituloTransacional(title!, {
      valorRecebido: 5000,
      dataRecebimento: '2026-09-10',
      formaPagamento: 'Transferência Bancária',
    });

    expect(tituloParcial.status).toBe('Recebido Parcialmente');
    expect(tituloParcial.valorRecebido).toBe(5000);
    expect(tituloParcial.saldo).toBe(7000);
  });

  describe('Date Calculation Edge Cases', () => {
    it('6. Deve calcular corretamente anos bissextos', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2026)).toBe(false);
      expect(isLeapYear(2028)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(1900)).toBe(false);
    });

    it('7. Deve ajustar dia 31 para o último dia de meses com menos dias', () => {
      // Fevereiro 2026 (não bissexto -> 28 dias)
      expect(getSafeDayInMonth(2026, 1, 31)).toBe(28);
      // Fevereiro 2024 (bissexto -> 29 dias)
      expect(getSafeDayInMonth(2024, 1, 31)).toBe(29);
      // Abril (30 dias)
      expect(getSafeDayInMonth(2026, 3, 31)).toBe(30);
      // Janeiro (31 dias)
      expect(getSafeDayInMonth(2026, 0, 31)).toBe(31);
    });

    it('8. Deve avançar recorrência mensal do dia 31 para 28 de fevereiro', () => {
      const base = new Date(2026, 0, 31); // 31 Jan 2026
      const nextMonth = calculateNextDueDate(base, 'Mensal', 31, 1);

      expect(nextMonth.getFullYear()).toBe(2026);
      expect(nextMonth.getMonth()).toBe(1); // Fevereiro
      expect(nextMonth.getDate()).toBe(28); // 28/02/2026
    });

    it('9. Formatar competência contábil corretamente', () => {
      const d = new Date(2026, 8, 10); // Setembro/2026
      expect(formatCompetencia(d)).toBe('09/2026');
      expect(getReferencePeriod(d)).toBe('2026-09');
    });
  });
});
