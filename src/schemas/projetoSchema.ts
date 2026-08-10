import { z } from 'zod';

export const tipoProjetoSchema = z.enum([
  'Software Sob Medida',
  'Sistema Web',
  'Sistema Integrado',
  'Aplicativo Mobile',
  'Automação',
  'Business Intelligence',
  'Dashboard',
  'Inteligência Artificial',
  'Consultoria',
  'API',
  'Integração',
  'Landing Page',
  'Website',
  'E-commerce',
  'Outro',
]);

export const statusProjetoSchema = z.enum([
  'Planejamento',
  'Kickoff',
  'Em Desenvolvimento',
  'Em Homologação',
  'Aguardando Cliente',
  'Em Revisão',
  'Implantação',
  'Concluído',
  'Cancelado',
  'Suspenso',
]);

export const prioridadeProjetoSchema = z.enum([
  'Baixa',
  'Média',
  'Alta',
  'Crítica',
]);

export const projetoSchema = z.object({
  id: z.string().optional(),
  codigo: z.string().min(1, 'Código é obrigatório'),
  nome: z.string().min(1, 'Nome do projeto é obrigatório'),
  idCliente: z.string().min(1, 'Cliente é obrigatório'),
  idContrato: z.string().optional(),
  tipo: tipoProjetoSchema.default('Software Sob Medida'),
  categoria: z.string().default('Desenvolvimento'),
  responsavelPrincipal: z.string().default('Gerente de Projetos'),
  prioridade: prioridadeProjetoSchema.default('Média'),
  status: statusProjetoSchema.default('Planejamento'),
  dataInicio: z.string().default(() => new Date().toISOString().split('T')[0]),
  dataFinal: z.string().default(() => new Date().toISOString().split('T')[0]),
  descricaoGeral: z.string().default(''),
  valorContratado: z.number().nonnegative().default(0),
  valorRecebido: z.number().nonnegative().default(0),
  saldoRestante: z.number().default(0),
  progressoGlobal: z.number().min(0).max(100).default(0),
  horasPlanejadas: z.number().nonnegative().default(0),
  horasRealizadas: z.number().nonnegative().default(0),
  ultimaAtualizacao: z.string().default(() => new Date().toISOString()),
});

export type ProjetoDTO = z.infer<typeof projetoSchema>;
