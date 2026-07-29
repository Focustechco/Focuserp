import { z } from 'zod';

export const cobrancaSchema = z.object({
  id: z.union([z.string().uuid(), z.literal('')]).optional(),
  tenantId: z.union([z.string().uuid(), z.literal('')]).optional(),
  clienteId: z.union([z.string().uuid(), z.literal('')]).optional(),
  clienteNome: z.string().optional().default(''),
  tituloId: z.union([z.string().uuid(), z.literal('')]).optional(),
  valorTotal: z.number().min(0, 'Valor total deve ser maior ou igual a zero').default(0),
  diasAtraso: z.number().min(0, 'Dias de atraso deve ser maior ou igual a zero').default(0),
  etapaAtual: z.string().default('Lembrete Preventivo'),
  status: z.enum(['Em Aberto', 'Em Negociação', 'Acordo Fechado', 'Quitada', 'Cancelada']).default('Em Aberto'),
  historicoInteracoes: z.array(z.record(z.any())).default([]),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type CobrancaDTO = z.infer<typeof cobrancaSchema>;
