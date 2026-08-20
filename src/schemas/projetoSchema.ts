import { z } from 'zod';

export const normalizePrioridade = (val: unknown): 'Baixa' | 'Média' | 'Alta' | 'Crítica' => {
  if (typeof val !== 'string') return 'Média';
  const v = val.trim();
  if (v === 'Mdia' || v === 'Media' || v === 'Média') return 'Média';
  if (v === 'Crtica' || v === 'Critica' || v === 'Crítica' || v === 'Urgente') return 'Crítica';
  if (v === 'Baixa') return 'Baixa';
  if (v === 'Alta') return 'Alta';
  return 'Média';
};

export const normalizeStatus = (
  val: unknown
):
  | 'Planejamento'
  | 'Kickoff'
  | 'Em Desenvolvimento'
  | 'Em Homologação'
  | 'Aguardando Cliente'
  | 'Em Revisão'
  | 'Implantação'
  | 'Concluído'
  | 'Cancelado'
  | 'Suspenso' => {
  if (typeof val !== 'string') return 'Planejamento';
  const v = val.trim();
  if (
    v === 'Em Homologao' ||
    v === 'Em Homologação' ||
    v === 'Homologação' ||
    v === 'Homologao'
  )
    return 'Em Homologação';
  if (v === 'Concludo' || v === 'Concluido' || v === 'Concluído') return 'Concluído';
  if (v === 'Implantação' || v === 'Implantacao') return 'Implantação';
  if (v === 'Em Revisão' || v === 'Em Revisao') return 'Em Revisão';
  if (v === 'Kickoff') return 'Kickoff';
  if (v === 'Em Desenvolvimento') return 'Em Desenvolvimento';
  if (v === 'Aguardando Cliente') return 'Aguardando Cliente';
  if (v === 'Cancelado') return 'Cancelado';
  if (v === 'Suspenso') return 'Suspenso';
  return 'Planejamento';
};

export const normalizeTipoProjeto = (val: unknown): string => {
  if (typeof val !== 'string') return 'Software Sob Medida';
  const v = val.trim();
  if (v === 'API' || v === 'API / Integrao' || v === 'API / Integração') return 'API';
  if (v === 'Website' || v === 'Website Institucional') return 'Website';
  return v || 'Software Sob Medida';
};

export const tipoProjetoSchema = z.preprocess(
  (val) => normalizeTipoProjeto(val),
  z.string()
);

export const statusProjetoSchema = z.preprocess(
  (val) => normalizeStatus(val),
  z.enum([
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
  ])
);

export const prioridadeProjetoSchema = z.preprocess(
  (val) => normalizePrioridade(val),
  z.enum(['Baixa', 'Média', 'Alta', 'Crítica'])
);

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
