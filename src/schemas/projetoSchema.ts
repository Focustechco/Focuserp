import { z } from 'zod';

export const projetoSchema = z.object({
  id: z.union([z.string().uuid(), z.literal('')]).optional(),
  tenantId: z.union([z.string().uuid(), z.literal('')]).optional(),
  codigo: z.string().min(1, 'Código do projeto é obrigatório'),
  nome: z.string().min(1, 'Nome do projeto é obrigatório'),
  clienteId: z.union([z.string().uuid(), z.literal('')]).optional(),
  clienteNome: z.string().optional().default(''),
  idContrato: z.union([z.string().uuid(), z.literal('')]).optional(),
  tipo: z.string().default('Desenvolvimento'),
  categoria: z.string().optional(),
  responsavelPrincipal: z.string().optional().default(''),
  orcamentoEstimado: z.number().min(0, 'Orçamento estimado deve ser maior ou igual a zero').optional().default(0),
  valorContratado: z.number().min(0, 'Valor contratado deve ser maior ou igual a zero').default(0),
  valorRecebido: z.number().min(0, 'Valor recebido deve ser maior ou igual a zero').default(0),
  saldoRestante: z.number().optional(),
  progressoGlobal: z.number().min(0).max(100).default(0),
  prioridade: z.enum(['Baixa', 'Média', 'Alta', 'Crítica']).default('Média'),
  status: z.enum(['Planejamento', 'Em Andamento', 'Pausado', 'Concluído', 'Cancelado']).default('Planejamento'),
  dataInicio: z.string().optional(),
  dataFinal: z.string().optional(),
  descricaoGeral: z.string().optional(),
  horasPlanejadas: z.number().min(0, 'Horas planejadas deve ser maior ou igual a zero').default(0),
  horasRealizadas: z.number().min(0, 'Horas realizadas deve ser maior ou igual a zero').default(0),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ProjetoDTO = z.infer<typeof projetoSchema>;
