import { z } from 'zod';

export const formaPagamentoSchema = z.enum([
  'PIX',
  'Boleto',
  'Cartão',
  'Transferência',
  'TED',
  'DOC',
  'Débito',
  'Dinheiro',
  'Outros',
]);

export const frequenciaRecorrenciaSchema = z.enum([
  'Semanal',
  'Quinzenal',
  'Mensal',
  'Trimestral',
  'Semestral',
  'Anual',
]);

export const historicoSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  data: z.string().default(() => new Date().toISOString()),
  usuario: z.string().default('Sistema'),
  acao: z.string(),
  observacao: z.string().optional(),
});

export const parcelaSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  numero: z.number(),
  valor: z.number(),
  vencimento: z.string(),
  status: z.string().default('Pendente'),
  historico: z.array(historicoSchema).default([]),
});

export const tituloReceberSchema = z.object({
  id: z.string().optional(),
  numero: z.string().min(1, 'Número é obrigatório'),
  cliente: z.string().min(1, 'Cliente é obrigatório'),
  clienteId: z.string().optional(),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  categoria: z.string().default('Receita Operacional'),
  valorOriginal: z.number().nonnegative('Valor deve ser positivo'),
  valorRecebido: z.number().default(0),
  saldo: z.number().default(0),
  dataEmissao: z.string().default(() => new Date().toISOString().split('T')[0]),
  dataVencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  dataRecebimento: z.string().optional(),
  formaPagamento: formaPagamentoSchema.default('PIX'),
  status: z.enum(['Previsto', 'Pendente', 'Recebido', 'Recebido Parcialmente', 'Atrasado', 'Cancelado', 'Renegociado']).default('Pendente'),
  responsavel: z.string().default('Administrador'),
  ultimaAtualizacao: z.string().default(() => new Date().toISOString()),
  desconto: z.number().optional(),
  multa: z.number().optional(),
  juros: z.number().optional(),
  valorLiquido: z.number().optional(),
  competencia: z.string().optional(),
  observacoes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  historico: z.array(historicoSchema).default([]),
  parcelas: z.array(parcelaSchema).optional(),
  recorrente: z.boolean().default(false),
  recorrenciaId: z.string().optional(),
  origem: z.string().optional(),
  recorrenciaFrequencia: frequenciaRecorrenciaSchema.optional(),
  recorrenciaFim: z.string().optional(),
});

export const contaPagarSchema = z.object({
  id: z.string().optional(),
  numero: z.string().min(1, 'Número é obrigatório'),
  fornecedor: z.string().min(1, 'Fornecedor é obrigatório'),
  fornecedorId: z.string().optional(),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  categoria: z.string().default('Despesa Operacional'),
  valorOriginal: z.number().nonnegative('Valor deve ser positivo'),
  valorPago: z.number().default(0),
  saldo: z.number().default(0),
  dataEmissao: z.string().default(() => new Date().toISOString().split('T')[0]),
  dataVencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  dataPagamento: z.string().optional(),
  formaPagamento: formaPagamentoSchema.default('PIX'),
  status: z.enum(['Previsto', 'Pendente', 'Pago', 'Pago Parcialmente', 'Vencido', 'Cancelado', 'Renegociado']).default('Pendente'),
  responsavel: z.string().default('Administrador'),
  ultimaAtualizacao: z.string().default(() => new Date().toISOString()),
  desconto: z.number().optional(),
  multa: z.number().optional(),
  juros: z.number().optional(),
  valorFinal: z.number().optional(),
  competencia: z.string().optional(),
  observacoes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  historico: z.array(historicoSchema).default([]),
  parcelas: z.array(parcelaSchema).optional(),
  recorrente: z.boolean().default(false),
  recorrenciaFrequencia: frequenciaRecorrenciaSchema.optional(),
  recorrenciaFim: z.string().optional(),
});

export type TituloReceberDTO = z.infer<typeof tituloReceberSchema>;
export type ContaPagarDTO = z.infer<typeof contaPagarSchema>;
export type ParcelaDTO = z.infer<typeof parcelaSchema>;
export type HistoricoDTO = z.infer<typeof historicoSchema>;
