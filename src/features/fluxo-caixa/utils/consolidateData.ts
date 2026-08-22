import { MovimentacaoFluxo, StatusMovimentacao } from "../types";
import { TituloReceber } from "../../contas-receber/types";
import { ContaPagar } from "../../contas-pagar/types";
import { parseDateSafe, getBrasiliaTodayIso } from "@/lib/dateUtils";

/**
 * Consolida o Fluxo de Caixa Real a partir das movimentações financeiras liquidadas.
 * 
 * REGRA CONTÁBIL ABSOLUTA:
 * - Apenas títulos que foram RECEBIDOS no módulo 'Contas a Receber' entram no Fluxo de Caixa.
 * - Recorrências cadastradas entram exclusivamente no módulo 'Contas a Receber' como títulos pendentes.
 * - Somente após o usuário dar baixa/recebimento no 'Contas a Receber' é que o valor é transferido para o Fluxo de Caixa.
 * - Apenas contas que foram PAGAS no módulo 'Contas a Pagar' entram no Fluxo de Caixa como saídas.
 */
export const consolidateFluxoFromStores = (
  titulos: TituloReceber[] = [],
  contas: ContaPagar[] = []
): MovimentacaoFluxo[] => {
  const fluxo: MovimentacaoFluxo[] = [];
  const hoje = getBrasiliaTodayIso();

  // 1. Mapear Receitas: EXCLUSIVAMENTE títulos que foram RECEBIDOS no Contas a Receber
  titulos.forEach((titulo) => {
    // Se o título não estiver recebido (ex: pendente de aprovação, previsão ou cancelado), NÃO entra no fluxo de caixa
    if (titulo.status !== "Recebido" && titulo.status !== "Recebido Parcialmente") {
      return;
    }

    const valorRec = titulo.valorRecebido || titulo.valorOriginal || 0;
    const dataMov = titulo.dataRecebimento || titulo.dataVencimento || hoje;

    fluxo.push({
      id: `fluxo-rec-${titulo.id}`,
      idOrigem: titulo.id,
      moduloOrigem: "Contas a Receber",
      tipo: "Entrada",
      dataCompetencia: dataMov,
      dataPagamento: titulo.dataRecebimento,
      clienteFornecedor: titulo.cliente || "Cliente",
      descricao: titulo.descricao || "Recebimento",
      categoria: titulo.categoria || "Geral",
      valorOriginal: titulo.valorOriginal || 0,
      valorRealizado: valorRec,
      status: "Confirmada",
      saldoAcumuladoDia: 0,
    });
  });

  // 2. Mapear Despesas: EXCLUSIVAMENTE contas que foram PAGAS no Contas a Pagar
  contas.forEach((conta) => {
    // Se a conta não estiver paga (ex: pendente, vencida ou cancelada), NÃO entra no fluxo de caixa
    if (conta.status !== "Pago" && conta.status !== "Pago Parcialmente") {
      return;
    }

    const valorPg = conta.valorPago || conta.valorOriginal || 0;
    const dataMov = conta.dataPagamento || conta.dataVencimento || hoje;

    fluxo.push({
      id: `fluxo-pag-${conta.id}`,
      idOrigem: conta.id,
      moduloOrigem: "Contas a Pagar",
      tipo: "Saída",
      dataCompetencia: dataMov,
      dataPagamento: conta.dataPagamento,
      clienteFornecedor: conta.fornecedor || "Fornecedor",
      descricao: conta.descricao || "Despesa",
      categoria: conta.categoria || "Operacional",
      valorOriginal: conta.valorOriginal || 0,
      valorRealizado: valorPg,
      status: "Confirmada",
      saldoAcumuladoDia: 0,
    });
  });

  // Ordenar cronologicamente pela data com parse seguro no horário de Brasília
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
