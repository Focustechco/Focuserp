export type ContaStatus = "Previsto" | "Pendente" | "Pago" | "Pago Parcialmente" | "Vencido" | "Cancelado" | "Renegociado";

export type FormaPagamento = "PIX" | "Boleto" | "Transferência" | "TED" | "DOC" | "Cartão" | "Débito" | "Dinheiro" | "Outros";

export type FrequenciaRecorrencia = "Semanal" | "Quinzenal" | "Mensal" | "Trimestral" | "Semestral" | "Anual";

export interface ParcelaConta {
  id: string;
  numero: number;
  valor: number;
  vencimento: string; // ISO date
  status: ContaStatus;
  historico: HistoricoConta[];
}

export interface HistoricoConta {
  id: string;
  data: string; // ISO datetime
  usuario: string;
  acao: string; // Criação, Alteração, Pagamento, Renegociação, Cancelamento
  observacao?: string;
}

export interface ContaPagar {
  id: string;
  numero: string;
  fornecedor: string;
  descricao: string;
  categoria: string;
  categoriaId?: string;
  centroCustoId?: string;
  centroCustoNome?: string;
  centroCusto?: string;
  valorOriginal: number;
  valorPago: number;
  saldo: number;
  dataEmissao: string; // ISO Date
  dataVencimento: string; // ISO Date
  dataPagamento?: string; // ISO Date
  formaPagamento: FormaPagamento;
  status: ContaStatus;
  responsavel: string;
  ultimaAtualizacao: string; // ISO Datetime
  
  // Detalhes extras
  desconto?: number;
  multa?: number;
  juros?: number;
  valorFinal?: number;
  competencia?: string;
  observacoes?: string;
  tags?: string[];
  
  // Estruturas complexas
  historico: HistoricoConta[];
  parcelas?: ParcelaConta[];
  
  // Recorrência
  recorrente?: boolean;
  recorrenciaFrequencia?: FrequenciaRecorrencia;
  recorrenciaFim?: string; // ISO Date
}
