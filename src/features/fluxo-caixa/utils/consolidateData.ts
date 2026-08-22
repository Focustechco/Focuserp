import { MovimentacaoFluxo, StatusMovimentacao } from "../types";
import { TituloReceber } from "../../contas-receber/types";
import { ContaPagar } from "../../contas-pagar/types";
import { parseDateSafe, getBrasiliaTodayIso } from "@/lib/dateUtils";

/**
 * Consolida o Fluxo de Caixa a partir dos títulos e contas recebidos/pagos.
 * 
 * REGRA CONTÁBIL:
 * - Títulos em aberto/pendentes (incluindo parcelas de recorrência) residem no Contas a Receber.
 * - Ao confirmar/aprovar o recebimento no Contas a Receber (status 'Recebido'), o registro
 *   entra IMEDIATAMENTE no Fluxo de Caixa como entrada confirmada e atualiza o saldo real.
 * - Ao registrar o pagamento no Contas a Pagar (status 'Pago'), o registro entra
 *   IMEDIATAMENTE no Fluxo de Caixa como saída confirmada.
 */
export const consolidateFluxoFromStores = (
  titulos: TituloReceber[] = [],
  contas: ContaPagar[] = []
): MovimentacaoFluxo[] => {
  const fluxo: MovimentacaoFluxo[] = [];
  const hoje = getBrasiliaTodayIso();

  // 1. Mapear Receitas: Títulos que foram RECEBIDOS / LIQUIDADOS
  titulos.forEach((titulo) => {
    const statusNormalized = (titulo.status || '').trim().toLowerCase();
    const isRecebido = statusNormalized === 'recebido' || statusNormalized === 'recebido parcialmente' || statusNormalized === 'liquidado' || statusNormalized === 'pago';

    // Se o título não estiver recebido/liquidado, não entra no fluxo de caixa
    if (!isRecebido) {
      return;
    }

    const valorRec = Number(titulo.valorRecebido || titulo.valorOriginal || 0);
    const dataMov = titulo.dataRecebimento || titulo.dataVencimento || hoje;

    fluxo.push({
      id: `fluxo-rec-${titulo.id}`,
      idOrigem: titulo.id,
      moduloOrigem: "Contas a Receber",
      tipo: "Entrada",
      dataCompetencia: dataMov,
      dataPagamento: titulo.dataRecebimento || dataMov,
      clienteFornecedor: titulo.cliente || "Cliente",
      descricao: titulo.descricao || "Recebimento",
      categoria: titulo.categoria || "Geral",
      valorOriginal: Number(titulo.valorOriginal || valorRec),
      valorRealizado: valorRec,
      status: "Confirmada",
      saldoAcumuladoDia: 0,
    });
  });

  // 2. Mapear Despesas: Contas que foram PAGAS / LIQUIDADAS
  contas.forEach((conta) => {
    const statusNormalized = (conta.status || '').trim().toLowerCase();
    const isPago = statusNormalized === 'pago' || statusNormalized === 'pago parcialmente' || statusNormalized === 'liquidado';

    // Se a conta não estiver paga/liquidada, não entra no fluxo de caixa
    if (!isPago) {
      return;
    }

    const valorPg = Number(conta.valorPago || conta.valorOriginal || 0);
    const dataMov = conta.dataPagamento || conta.dataVencimento || hoje;

    fluxo.push({
      id: `fluxo-pag-${conta.id}`,
      idOrigem: conta.id,
      moduloOrigem: "Contas a Pagar",
      tipo: "Saída",
      dataCompetencia: dataMov,
      dataPagamento: conta.dataPagamento || dataMov,
      clienteFornecedor: conta.fornecedor || "Fornecedor",
      descricao: conta.descricao || "Despesa",
      categoria: conta.categoria || "Operacional",
      valorOriginal: Number(conta.valorOriginal || valorPg),
      valorRealizado: valorPg,
      status: "Confirmada",
      saldoAcumuladoDia: 0,
    });
  });

  // Ordenar cronologicamente pela data de realização com parse seguro
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
