import { FormaPagamento } from '@/features/contas-receber/types';

export type FrequenciaRecorrencia = 
  | 'Mensal' 
  | 'Semanal' 
  | 'Quinzenal' 
  | 'Trimestral' 
  | 'Semestral' 
  | 'Anual';

export type StatusRecorrencia = 'Ativa' | 'Pausada' | 'Encerrada';

export interface RecorrenciaFinanceira {
  id: string; // Ex: rec_... ou UUID
  clientId: string; // Vínculo estrito com o ID do cliente
  clienteNome: string;
  descricao: string;
  valor: number;
  frequencia: FrequenciaRecorrencia;
  dataInicio: string; // YYYY-MM-DD
  proximaCobranca: string; // YYYY-MM-DD
  diaVencimento?: number; // 1 a 31
  quantidade?: number | null; // null/undefined = Indefinida
  status: StatusRecorrencia;
  categoria?: string;
  formaPagamento?: FormaPagamento;
  observacoes?: string;
  origem: 'cliente' | 'financeiro' | 'contrato';
  contratoId?: string;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}
