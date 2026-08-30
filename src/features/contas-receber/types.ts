export type TituloStatus = "Previsto" | "Pendente" | "Recebido" | "Recebido Parcialmente" | "Atrasado" | "Cancelado" | "Renegociado";

export type FormaPagamento = "PIX" | "Boleto" | "Cartão" | "Transferência" | "TED" | "DOC" | "Dinheiro" | "Outros";

export type FrequenciaRecorrencia = "Semanal" | "Quinzenal" | "Mensal" | "Trimestral" | "Semestral" | "Anual";

export interface Parcela {
  id: string;
  numero: number;
  valor: number;
  vencimento: string; // ISO date (YYYY-MM-DD)
  status: TituloStatus;
  historico: Historico[];
}

export interface Historico {
  id: string;
  data: string; // ISO datetime
  usuario: string;
  acao: string; // Criação, Alteração, Recebimento, Renegociação, Cancelamento
  observacao?: string;
}

export interface TituloReceber {
  id: string;
  numero: string;
  cliente: string;
  clienteId?: string;
  recorrenciaId?: string;
  origem?: string;
  descricao: string;
  categoria: string;
  categoriaId?: string;
  centroCustoId?: string;
  centroCustoNome?: string;
  centroCusto?: string;
  valorOriginal: number;
  valorRecebido: number;
  saldo: number;
  dataEmissao: string; // ISO Date (YYYY-MM-DD)
  dataVencimento: string; // ISO Date (YYYY-MM-DD)
  dataRecebimento?: string; // ISO Date (YYYY-MM-DD)
  formaPagamento: FormaPagamento;
  status: TituloStatus;
  responsavel: string;
  ultimaAtualizacao: string; // ISO Datetime
  
  // Detalhes extras
  desconto?: number;
  multa?: number;
  juros?: number;
  valorLiquido?: number;
  competencia?: string;
  observacoes?: string;
  tags?: string[];
  
  // Estruturas complexas
  historico: Historico[];
  parcelas?: Parcela[];
  
  // Recorrência
  recorrente?: boolean;
  recorrenciaFrequencia?: FrequenciaRecorrencia;
  recorrenciaFim?: string; // ISO Date
}
