import { MovimentacaoFluxo, StatusMovimentacao } from "../types";
import { TituloReceber } from "../../contas-receber/types";
import { ContaPagar } from "../../contas-pagar/types";
import { parseDateSafe, getBrasiliaTodayIso } from "@/lib/dateUtils";

export const consolidateFluxoFromStores = (
  titulos: TituloReceber[] = [],
  contas: ContaPagar[] = []
): MovimentacaoFluxo[] => {
  const fluxo: MovimentacaoFluxo[] = [];
  const hoje = getBrasiliaTodayIso();

  // 1. Mapear Receitas Exclusivamente a partir de Contas a Receber (onde entram as recorrências para aprovação/baixa)
  titulos.forEach((titulo) => {
    let statusFx: StatusMovimentacao = "Prevista";
    if (titulo.status === "Recebido") statusFx = "Confirmada";
    else if (titulo.status === "Recebido Parcialmente") statusFx = "Parcial";
    else if (titulo.status === "Cancelado") statusFx = "Cancelada";

    const isRecebido = statusFx === "Confirmada";
    const isParcial = statusFx === "Parcial";

    fluxo.push({
      id: `fluxo-rec-${titulo.id}`,
      idOrigem: titulo.id,
      moduloOrigem: "Contas a Receber",
      tipo: "Entrada",
      dataCompetencia: titulo.dataVencimento || hoje,
      dataPagamento: titulo.dataRecebimento,
      clienteFornecedor: titulo.cliente || "Cliente",
      descricao: titulo.descricao || "Recebimento",
      categoria: titulo.categoria || "Geral",
      valorOriginal: titulo.valorOriginal || 0,
      valorRealizado: isRecebido ? (titulo.valorRecebido || titulo.valorOriginal || 0) : isParcial ? (titulo.valorRecebido || 0) : 0,
      status: statusFx,
      saldoAcumuladoDia: 0,
    });
  });

  // 2. Mapear Despesas (Contas a Pagar)
  contas.forEach((conta) => {
    let statusFx: StatusMovimentacao = "Prevista";
    if (conta.status === "Pago") statusFx = "Confirmada";
    else if (conta.status === "Pago Parcialmente") statusFx = "Parcial";
    else if (conta.status === "Cancelado") statusFx = "Cancelada";

    const isPago = statusFx === "Confirmada";
    const isParcial = statusFx === "Parcial";

    fluxo.push({
      id: `fluxo-pag-${conta.id}`,
      idOrigem: conta.id,
      moduloOrigem: "Contas a Pagar",
      tipo: "Saída",
      dataCompetencia: conta.dataVencimento || hoje,
      dataPagamento: conta.dataPagamento,
      clienteFornecedor: conta.fornecedor || "Fornecedor",
      descricao: conta.descricao || "Despesa",
      categoria: conta.categoria || "Operacional",
      valorOriginal: conta.valorOriginal || 0,
      valorRealizado: isPago ? (conta.valorPago || conta.valorOriginal || 0) : isParcial ? (conta.valorPago || 0) : 0,
      status: statusFx,
      saldoAcumuladoDia: 0,
    });
  });

  // Ordenar cronologicamente pela data de competência (vencimento) com parse seguro
  fluxo.sort((a, b) => parseDateSafe(a.dataCompetencia).getTime() - parseDateSafe(b.dataCompetencia).getTime());

  // Calcular Saldo Acumulado REAL de Caixa (apenas movimentos confirmados/liquidados)
  let saldoRealizadoCorrente = 0;

  fluxo.forEach((mov) => {
    if (mov.status === "Cancelada") {
      mov.saldoAcumuladoDia = saldoRealizadoCorrente;
      return;
    }

    // REGRA CONTÁBIL RIGOROSA:
    // Apenas valores efetivamente recebidos/pagos (Confirmada / Parcial) impactam o Saldo Real de Caixa!
    // Lançamentos 'Prevista' (aguardando aprovação/baixa em Contas a Receber) têm impacto ZERO no caixa real!
    if (mov.status === "Confirmada" || mov.status === "Parcial") {
      if (mov.tipo === "Entrada") {
        saldoRealizadoCorrente += mov.valorRealizado;
      } else {
        saldoRealizadoCorrente -= mov.valorRealizado;
      }
    }

    mov.saldoAcumuladoDia = saldoRealizadoCorrente;
  });

  return fluxo;
};

// Manter exportações retrocompatíveis para evitar quebra de contrato de componentes legados
export const generateFluxoData = (): MovimentacaoFluxo[] => [];
export const fluxoConsolidado: MovimentacaoFluxo[] = [];
export const currentBalance = 0;
