import { MovimentacaoFluxo } from "../types";
import { TituloReceber } from "../../contas-receber/types";
import { ContaPagar } from "../../contas-pagar/types";
import { parseDateSafe, getBrasiliaTodayIso } from "@/lib/dateUtils";

/**
 * Consolida o Fluxo de Caixa Real a partir das movimentações financeiras liquidadas.
 * 
 * REGRA CONTÁBIL ESTRITA:
 * 1. As recorrências do cliente residem EXCLUSIVAMENTE no módulo 'Contas a Receber'.
 * 2. Somente ao clicar em 'Registrar Recebimento' / 'Aprovar / Baixar' no 'Contas a Receber',
 *    o título passa para o status 'Recebido' e ENTRA no Fluxo de Caixa como entrada realizada.
 * 3. Títulos pendentes, em aberto ou previsões NÃO aparecem no Fluxo de Caixa.
 * 4. No Contas a Pagar, somente contas com status 'Pago' entram no Fluxo de Caixa como saídas.
 */
export const consolidateFluxoFromStores = (
  titulos: TituloReceber[] = [],
  contas: ContaPagar[] = []
): MovimentacaoFluxo[] => {
  const fluxo: MovimentacaoFluxo[] = [];
  const hoje = getBrasiliaTodayIso();

  // 1. Mapear Receitas: EXCLUSIVAMENTE títulos que foram RECEBIDOS no Contas a Receber
  titulos.forEach((titulo) => {
    const statusNorm = (titulo.status || '').trim().toLowerCase();
    const isRecebido = statusNorm === 'recebido' || statusNorm === 'liquidado' || statusNorm === 'pago';
    const isParcial = statusNorm === 'recebido parcialmente';

    // Se o título não foi recebido (ex: pendente, em aberto, previsto, cancelado), NÃO ENTRA no Fluxo de Caixa
    if (!isRecebido && !isParcial) {
      return;
    }

    const valorOriginal = Number(titulo.valorOriginal ?? titulo.saldo ?? 0);
    const valorRealizado = isRecebido 
      ? Number(titulo.valorRecebido || valorOriginal) 
      : Number(titulo.valorRecebido || 0);

    const dataCompetencia = titulo.dataRecebimento || titulo.dataVencimento || hoje;

    fluxo.push({
      id: `fluxo-rec-${titulo.id}`,
      idOrigem: titulo.id,
      moduloOrigem: "Contas a Receber",
      tipo: "Entrada",
      dataCompetencia: dataCompetencia,
      dataPagamento: titulo.dataRecebimento || dataCompetencia,
      clienteFornecedor: titulo.cliente || "Cliente",
      descricao: titulo.descricao || `Recebimento ${titulo.numero || ''}`.trim(),
      categoria: titulo.categoria || "Geral",
      valorOriginal: valorOriginal,
      valorRealizado: valorRealizado,
      status: "Confirmada",
      saldoAcumuladoDia: 0,
    });
  });

  // 2. Mapear Despesas: EXCLUSIVAMENTE contas que foram PAGAS no Contas a Pagar
  contas.forEach((conta) => {
    const statusNorm = (conta.status || '').trim().toLowerCase();
    const isPago = statusNorm === 'pago' || statusNorm === 'liquidado';
    const isParcial = statusNorm === 'pago parcialmente';

    // Se a conta não foi paga, NÃO ENTRA no Fluxo de Caixa
    if (!isPago && !isParcial) {
      return;
    }

    const valorOriginal = Number(conta.valorOriginal ?? conta.saldo ?? 0);
    const valorRealizado = isPago 
      ? Number(conta.valorPago || valorOriginal) 
      : Number(conta.valorPago || 0);

    const dataCompetencia = conta.dataPagamento || conta.dataVencimento || hoje;

    fluxo.push({
      id: `fluxo-pag-${conta.id}`,
      idOrigem: conta.id,
      moduloOrigem: "Contas a Pagar",
      tipo: "Saída",
      dataCompetencia: dataCompetencia,
      dataPagamento: conta.dataPagamento || dataCompetencia,
      clienteFornecedor: conta.fornecedor || "Fornecedor",
      descricao: conta.descricao || `Pagamento ${conta.numero || ''}`.trim(),
      categoria: conta.categoria || "Operacional",
      valorOriginal: valorOriginal,
      valorRealizado: valorRealizado,
      status: "Confirmada",
      saldoAcumuladoDia: 0,
    });
  });

  // Ordenar cronologicamente pela data de realização
  fluxo.sort((a, b) => parseDateSafe(a.dataCompetencia).getTime() - parseDateSafe(b.dataCompetencia).getTime());

  // Calcular Saldo Acumulado REAL de Caixa
  let saldoRealizadoCorrente = 0;

  fluxo.forEach((mov) => {
    if (mov.tipo === "Entrada") {
      saldoRealizadoCorrente += mov.valorRealizado;
    } else {
      saldoRealizadoCorrente -= mov.valorRealizado;
    }
    mov.saldoAcumuladoDia = saldoRealizadoCorrente;
  });

  return fluxo;
};

// Manter exportações retrocompatíveis para evitar quebra de contrato de componentes legados
export const generateFluxoData = (): MovimentacaoFluxo[] => [];
export const fluxoConsolidado: MovimentacaoFluxo[] = [];
export const currentBalance = 0;
