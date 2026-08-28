import {
  recurringBillingService,
  isLeapYear,
  getSafeDayInMonth,
  calculateNextDueDate,
  formatCompetencia,
  getReferencePeriod,
} from '../src/features/recorrencias/services/recurringBillingService.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n==================================================');
  console.log('FOCUS ERP - SUITE DE TESTES DO MOTOR FINANCEIRO');
  console.log('==================================================\n');

  const mockRecorrencia = {
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

  console.log('--- 1. Criação de Recorrência & Geração Controlada ---');
  const firstRun = recurringBillingService.generateCurrentCycleTitle(mockRecorrencia, []);
  assert(firstRun.isNew === true, 'Gera novo título no primeiro ciclo');
  assert(firstRun.updatedList.length === 1, 'Gera EXCLUSIVAMENTE 1 título vigente (e não 12)');
  assert(firstRun.title?.status === 'Pendente', 'Status do título gerado é PENDENTE');
  assert(firstRun.title?.valorOriginal === 12000, 'Valor original é R$ 12.000,00');
  assert(firstRun.title?.valorRecebido === 0, 'Valor recebido inicial é R$ 0,00');
  assert(firstRun.title?.saldo === 12000, 'Saldo em aberto é R$ 12.000,00');

  console.log('\n--- 2. Idempotência de Geração ---');
  const secondRun = recurringBillingService.generateCurrentCycleTitle(mockRecorrencia, firstRun.updatedList);
  assert(secondRun.isNew === false, 'Não cria novo título se já executado');
  assert(secondRun.updatedList.length === 1, 'Mantém total de 1 título sem duplicações');
  assert(secondRun.title?.id === firstRun.title?.id, 'Preserva ID e dados do título original');

  console.log('\n--- 3. Baixa Transacional de Título ---');
  const tituloBaixado = await recurringBillingService.baixarTituloTransacional(firstRun.title, {
    valorRecebido: 12000,
    dataRecebimento: '2026-09-10',
    formaPagamento: 'PIX',
    usuario: 'Financeiro Admin',
  });
  assert(tituloBaixado.status === 'Recebido', 'Status atualizado para RECEBIDO');
  assert(tituloBaixado.valorRecebido === 12000, 'Valor recebido registrado R$ 12.000,00');
  assert(tituloBaixado.saldo === 0, 'Saldo remanescente zerado');
  assert(tituloBaixado.dataRecebimento === '2026-09-10', 'Data de recebimento registrada 2026-09-10');

  console.log('\n--- 4. Baixa Parcial de Título ---');
  const tituloParcial = await recurringBillingService.baixarTituloTransacional(firstRun.title, {
    valorRecebido: 5000,
    dataRecebimento: '2026-09-10',
    formaPagamento: 'Transferência',
  });
  assert(tituloParcial.status === 'Recebido Parcialmente', 'Status atualizado para Recebido Parcialmente');
  assert(tituloParcial.valorRecebido === 5000, 'Valor recebido R$ 5.000,00');
  assert(tituloParcial.saldo === 7000, 'Saldo aberto de R$ 7.000,00');

  console.log('\n--- 5. Casos Limite de Datas & Anos Bissextos ---');
  assert(isLeapYear(2024) === true, '2024 é ano bissexto');
  assert(isLeapYear(2026) === false, '2026 não é ano bissexto');
  assert(isLeapYear(2028) === true, '2028 é ano bissexto');
  assert(getSafeDayInMonth(2026, 1, 31) === 28, '31 de Fevereiro em 2026 ajusta para dia 28');
  assert(getSafeDayInMonth(2024, 1, 31) === 29, '31 de Fevereiro em 2024 (bissexto) ajusta para dia 29');
  assert(getSafeDayInMonth(2026, 3, 31) === 30, '31 de Abril ajusta para dia 30');

  const base = new Date(2026, 0, 31); // 31/01/2026
  const nextMonth = calculateNextDueDate(base, 'Mensal', 31, 1);
  assert(nextMonth.getMonth() === 1 && nextMonth.getDate() === 28, 'Recorrência mensal do dia 31 avança para 28/02');

  const d = new Date(2026, 8, 10);
  assert(formatCompetencia(d) === '09/2026', 'Formato de competência contábil é 09/2026');
  assert(getReferencePeriod(d) === '2026-09', 'Período de referência para idempotência é 2026-09');

  console.log('\n==================================================');
  console.log(`TOTAL: ${passed + failed} | APROVADOS: ${passed} | FALHAS: ${failed}`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
