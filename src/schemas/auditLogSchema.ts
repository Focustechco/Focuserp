import { z } from 'zod';

export const auditLogSchema = z.object({
  id: z.union([z.string().uuid(), z.literal('')]).optional(),
  tenantId: z.union([z.string().uuid(), z.literal('')]).optional(),
  userId: z.union([z.string().uuid(), z.literal('')]).optional(),
  userName: z.string().optional().default(''),
  action: z.string().min(1, 'Ação é obrigatória'),
  entity: z.string().optional().default(''),
  modulo: z.string().optional().default('Geral'),
  details: z.string().optional(),
  ip: z.string().optional(),
  dispositivo: z.string().optional(),
  detalhesJson: z.record(z.any()).optional().default({}),
  dataHora: z.string().optional(),
  created_at: z.string().optional(),
});

export type AuditLogDTO = z.infer<typeof auditLogSchema>;
