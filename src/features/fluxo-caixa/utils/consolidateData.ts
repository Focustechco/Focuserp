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
    if (titulo.status === "Recebido Parcialmente") statusFx = "Parcial";
    if (titulo.status === "Cancelado") statusFx = "Cancelada";

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
      valorRealizado: titulo.status === "Recebido" ? (titulo.valorRecebido || titulo.valorOriginal || 0) : (titulo.valorRecebido || 0),
      status: statusFx,
      saldoAcumuladoDia: 0,
    });
  });

  // 2. Mapear Despesas (Contas a Pagar)
  contas.forEach((conta) => {
    let statusFx: StatusMovimentacao = "Prevista";
    if (conta.status === "Pago") statusFx = "Confirmada";
    if (conta.status === "Pago Parcialmente") statusFx = "Parcial";
    if (conta.status === "Cancelado") statusFx = "Cancelada";

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
      valorRealizado: conta.status === "Pago" ? (conta.valorPago || conta.valorOriginal || 0) : (conta.valorPago || 0),
      status: statusFx,
      saldoAcumuladoDia: 0,
    });
  });

  // Ordenar cronologicamente pela data de competência (vencimento) com parse seguro
  fluxo.sort((a, b) => parseDateSafe(a.dataCompetencia).getTime() - parseDateSafe(b.dataCompetencia).getTime());

  // Calcular Saldo Acumulado
  let saldoCorrente = 0;

  fluxo.forEach((mov) => {
    if (mov.status === "Cancelada") {
      mov.saldoAcumuladoDia = saldoCorrente;
      return;
    }

    const valorImpacto =
      mov.status === "Confirmada" || mov.status === "Parcial"
        ? mov.valorRealizado
        : mov.valorOriginal;

    if (mov.tipo === "Entrada") {
      saldoCorrente += valorImpacto;
    } else {
      saldoCorrente -= valorImpacto;
    }
    mov.saldoAcumuladoDia = saldoCorrente;
  });

  return fluxo;
};

// Manter exportações retrocompatíveis para evitar quebra de contrato de componentes legados
export const generateFluxoData = (): MovimentacaoFluxo[] => [];
export const fluxoConsolidado: MovimentacaoFluxo[] = [];
export const currentBalance = 0;
