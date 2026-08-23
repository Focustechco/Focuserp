import { MovimentacaoFluxo, StatusMovimentacao } from "../types";
import { TituloReceber } from "../../contas-receber/types";
import { ContaPagar } from "../../contas-pagar/types";
import { parseDateSafe, getBrasiliaTodayIso } from "@/lib/dateUtils";

/**
 * Consolida todas as movimentações financeiras no Fluxo de Caixa
 * integrando em tempo real os módulos 'Contas a Receber' e 'Contas a Pagar'.
 */
export const consolidateFluxoFromStores = (
  titulos: TituloReceber[] = [],
  contas: ContaPagar[] = []
): MovimentacaoFluxo[] => {
  const fluxo: MovimentacaoFluxo[] = [];
  const hoje = getBrasiliaTodayIso();

  // 1. Mapear Receitas (Contas a Receber)
  titulos.forEach((titulo) => {
    const statusNormalized = (titulo.status || '').trim().toLowerCase();
    
    let statusFx: StatusMovimentacao = "Prevista";
    if (statusNormalized === 'recebido' || statusNormalized === 'liquidado' || statusNormalized === 'pago') {
      statusFx = "Confirmada";
    } else if (statusNormalized === 'recebido parcialmente') {
      statusFx = "Parcial";
    } else if (statusNormalized === 'cancelado' || statusNormalized === 'cancelada') {
      statusFx = "Cancelada";
    }

    const valorOriginal = Number(titulo.valorOriginal ?? titulo.saldo ?? 0);
    const valorRealizado = statusFx === "Confirmada" 
      ? Number(titulo.valorRecebido || valorOriginal) 
      : (statusFx === "Parcial" ? Number(titulo.valorRecebido || 0) : 0);

    const dataCompetencia = statusFx === "Confirmada" && titulo.dataRecebimento
      ? titulo.dataRecebimento
      : (titulo.dataVencimento || titulo.dataEmissao || hoje);

    fluxo.push({
      id: `fluxo-rec-${titulo.id}`,
      idOrigem: titulo.id,
      moduloOrigem: "Contas a Receber",
      tipo: "Entrada",
      dataCompetencia: dataCompetencia,
      dataPagamento: titulo.dataRecebimento,
      clienteFornecedor: titulo.cliente || "Cliente",
      descricao: titulo.descricao || `Recebimento ${titulo.numero || ''}`.trim(),
      categoria: titulo.categoria || "Geral",
      valorOriginal: valorOriginal,
      valorRealizado: valorRealizado,
      status: statusFx,
      saldoAcumuladoDia: 0,
    });
  });

  // 2. Mapear Despesas (Contas a Pagar)
  contas.forEach((conta) => {
    const statusNormalized = (conta.status || '').trim().toLowerCase();

    let statusFx: StatusMovimentacao = "Prevista";
    if (statusNormalized === 'pago' || statusNormalized === 'liquidado') {
      statusFx = "Confirmada";
    } else if (statusNormalized === 'pago parcialmente') {
      statusFx = "Parcial";
    } else if (statusNormalized === 'cancelado' || statusNormalized === 'cancelada') {
      statusFx = "Cancelada";
    }

    const valorOriginal = Number(conta.valorOriginal ?? conta.saldo ?? 0);
    const valorRealizado = statusFx === "Confirmada" 
      ? Number(conta.valorPago || valorOriginal) 
      : (statusFx === "Parcial" ? Number(conta.valorPago || 0) : 0);

    const dataCompetencia = statusFx === "Confirmada" && conta.dataPagamento
      ? conta.dataPagamento
      : (conta.dataVencimento || conta.dataEmissao || hoje);

    fluxo.push({
      id: `fluxo-pag-${conta.id}`,
      idOrigem: conta.id,
      moduloOrigem: "Contas a Pagar",
      tipo: "Saída",
      dataCompetencia: dataCompetencia,
      dataPagamento: conta.dataPagamento,
      clienteFornecedor: conta.fornecedor || "Fornecedor",
      descricao: conta.descricao || `Pagamento ${conta.numero || ''}`.trim(),
      categoria: conta.categoria || "Operacional",
      valorOriginal: valorOriginal,
      valorRealizado: valorRealizado,
      status: statusFx,
      saldoAcumuladoDia: 0,
    });
  });

  // Ordenar cronologicamente pela data de competência com parse seguro no horário de Brasília
  fluxo.sort((a, b) => parseDateSafe(a.dataCompetencia).getTime() - parseDateSafe(b.dataCompetencia).getTime());

  // Calcular Saldo Acumulado Progressivo
  let saldoCorrente = 0;

  fluxo.forEach((mov) => {
    if (mov.status === "Cancelada") {
      mov.saldoAcumuladoDia = saldoCorrente;
      return;
    }

    const valorImpacto = (mov.status === "Confirmada" || mov.status === "Parcial")
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
