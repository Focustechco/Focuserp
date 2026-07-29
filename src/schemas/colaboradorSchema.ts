import { z } from 'zod';

export const colaboradorSchema = z.object({
  id: z.union([z.string().uuid(), z.literal('')]).optional(),
  tenantId: z.union([z.string().uuid(), z.literal('')]).optional(),
  nomeCompleto: z.string().min(1, 'Nome completo é obrigatório'),
  cpf: z.string().optional().default(''),
  email: z.union([z.string().email('E-mail inválido'), z.literal('')]).optional().default(''),
  cargo: z.string().default('Colaborador'),
  departamento: z.string().default('Geral'),
  salarioBase: z.number().min(0, 'Salário base deve ser maior ou igual a zero').default(0),
  dataAdmissao: z.string().optional(),
  status: z.enum(['Ativo', 'Inativo', 'Afastado', 'Desligado']).default('Ativo'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ColaboradorDTO = z.infer<typeof colaboradorSchema>;
