import { z } from 'zod';

export const contratoSchema = z.object({
  id: z.union([z.string().uuid(), z.literal('')]).optional(),
  tenantId: z.union([z.string().uuid(), z.literal('')]).optional(),
  numeroContrato: z.string().min(1, 'Número do contrato é obrigatório'),
  clienteId: z.union([z.string().uuid(), z.literal('')]).optional(),
  clienteNome: z.string().optional().default(''),
  objetoContrato: z.string().min(1, 'Objeto do contrato é obrigatório'),
  valorTotal: z.number().min(0, 'Valor total deve ser maior ou igual a zero'),
  valorMensal: z.number().min(0, 'Valor mensal deve ser maior ou igual a zero').default(0),
  tipoContrato: z.string().default('Prestação de Serviços'),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().optional(),
  status: z.enum(['Ativo', 'Encerrado', 'Pendente', 'Cancelado', 'Em Aditivo']).default('Ativo'),
  renovacaoAutomatica: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ContratoDTO = z.infer<typeof contratoSchema>;
