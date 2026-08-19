import { z } from 'zod';

export const contaPagarSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().optional(),
  numero: z.string().optional(),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  fornecedorId: z.string().optional(),
  fornecedorNome: z.string().optional().default(''),
  categoria: z.string().default('Geral'),
  centroCusto: z.string().optional().default(''),
  valorOriginal: z.number().min(0, 'Valor original deve ser maior ou igual a zero'),
  desconto: z.number().min(0, 'Desconto deve ser maior ou igual a zero').default(0),
  multa: z.number().min(0, 'Multa deve ser maior ou igual a zero').default(0),
  juros: z.number().min(0, 'Juros deve ser maior ou igual a zero').default(0),
  valorFinal: z.number().optional(),
  valorPago: z.number().min(0, 'Valor pago deve ser maior ou igual a zero').default(0),
  saldo: z.number().optional(),
  saldoDevedor: z.number().optional(),
  dataEmissao: z.string().optional(),
  dataVencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  dataPagamento: z.string().optional(),
  formaPagamento: z.string().default('PIX'),
  status: z.enum([
    'Previsto',
    'Pendente',
    'Pago',
    'Pago Parcialmente',
    'Vencido',
    'Cancelado',
    'Renegociado'
  ]).default('Pendente'),
  responsavel: z.string().optional(),
  competencia: z.string().optional(),
  observacoes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  recorrente: z.boolean().default(false),
  recorrenciaFrequencia: z.string().optional(),
  recorrenciaFim: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ContaPagarDTO = z.infer<typeof contaPagarSchema>;
