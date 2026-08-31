export type TipoProjeto = 
  | 'Software Sob Medida' 
  | 'Sistema Web' 
  | 'Sistema Integrado' 
  | 'Aplicativo Mobile' 
  | 'Automação' 
  | 'Business Intelligence' 
  | 'Dashboard' 
  | 'Inteligência Artificial' 
  | 'Consultoria' 
  | 'API' 
  | 'Integração' 
  | 'Landing Page' 
  | 'Website' 
  | 'E-commerce' 
  | 'Outro';

export type StatusProjeto = 
  | 'Planejamento' 
  | 'Kickoff' 
  | 'Em Desenvolvimento' 
  | 'Em Homologação' 
  | 'Aguardando Cliente' 
  | 'Em Revisão' 
  | 'Implantação' 
  | 'Concluído' 
  | 'Cancelado' 
  | 'Suspenso';

export type PrioridadeProjeto = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export type TipoRequisito = 'Funcional' | 'Não Funcional' | 'Técnico';
export type StatusRequisito = 'Pendente' | 'Especificado' | 'Em Desenvolvimento' | 'Testado' | 'Aprovado';
export type PrioridadeRequisito = 'Essencial' | 'Importante' | 'Desejável';

export interface ProjectRequirement {
  id: string;
  projetoId: string;
  codigo: string; // RF-001, RNF-001, RT-001
  tipo: TipoRequisito;
  titulo: string;
  descricao: string;
  categoria: string;
  prioridade: PrioridadeRequisito;
  status: StatusRequisito;
  responsavel?: string;
  versao: string;
  criadoEm: string;
}

export type StatusBacklog = 'Novo' | 'Refinado' | 'Pronto para Sprint' | 'Em Sprint' | 'Concluído';
export type ComplexidadeBacklog = 'P' | 'M' | 'G' | 'GG';

export interface ProjectBacklogItem {
  id: string;
  projetoId: string;
  codigo: string; // BKG-01
  titulo: string;
  descricao: string;
  tipo: 'Feature' | 'Melhoria' | 'Bug' | 'Técnica' | 'Pesquisa';
  prioridade: PrioridadeProjeto;
  complexidade: ComplexidadeBacklog;
  storyPoints: number;
  estimativaHoras: number;
  requisitoId?: string;
  status: StatusBacklog;
  responsavel?: string;
  criadoEm: string;
}

export type StatusSprint = 'Planejada' | 'Ativa' | 'Concluída' | 'Cancelada';

export interface ProjectSprint {
  id: string;
  projetoId: string;
  numero: number;
  nome: string; // Sprint 01
  objetivo: string;
  dataInicio: string;
  dataFim: string;
  status: StatusSprint;
  responsavel?: string;
  capacidadeHoras: number;
  horasPlanejadas: number;
  horasRealizadas: number;
  progresso: number; // 0-100
}

export type TipoTask = 
  | 'Task' 
  | 'Story' 
  | 'Bug' 
  | 'Melhoria' 
  | 'Pesquisa' 
  | 'Design' 
  | 'Desenvolvimento' 
  | 'Teste' 
  | 'Deploy' 
  | 'Documentação' 
  | 'Integração';

export type StatusTask = 
  | 'Backlog' 
  | 'A Fazer' 
  | 'Em Andamento' 
  | 'Code Review' 
  | 'Em Teste' 
  | 'Bloqueado' 
  | 'Concluído';

export type DiaSemana = 
  | 'Segunda-feira' 
  | 'Terça-feira' 
  | 'Quarta-feira' 
  | 'Quinta-feira' 
  | 'Sexta-feira' 
  | 'Sábado' 
  | 'Domingo';

export interface ProjectTask {
  id: string;
  projetoId: string;
  sprintId?: string;
  codigo: string; // PRJ-T01
  titulo: string;
  descricao?: string;
  responsavel: string;
  prioridade: PrioridadeProjeto;
  status: StatusTask;
  tipo: TipoTask;
  dataInicio?: string;
  prazo: string;
  estimativaHoras: number;
  horasRealizadas: number;
  diaSemana?: DiaSemana;
  dataPlanejada?: string;
  requisitoId?: string;
  marcoId?: string;
  backlogId?: string;
  tags: string[];
  bloqueada: boolean;
  motivoBloqueio?: string;
  ordem: number;
  criadoEm: string;
}

export interface ProjectMilestone {
  id: string;
  projetoId: string;
  nivel: 1 | 2 | 3; // 1 = Macro Marco (Fase), 2 = Marco Principal, 3 = Marco Secundário
  parentId?: string;
  titulo: string;
  descricao?: string;
  dataPrevisao: string;
  dataConclusao?: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Atrasado';
  entregavel?: string;
  responsavel?: string;
  criadoEm: string;
}

export type PapelEquipe = 
  | 'Gerente de Projeto (PM)' 
  | 'Tech Lead' 
  | 'Desenvolvedor Frontend' 
  | 'Desenvolvedor Backend' 
  | 'Fullstack Engineer' 
  | 'UI/UX Designer' 
  | 'QA Tester' 
  | 'DevOps & Cloud' 
  | 'Product Owner (PO)' 
  | 'Consultor Técnico' 
  | 'Cliente / Stakeholder';

export interface ProjectMember {
  id: string;
  projetoId: string;
  usuarioId?: string;
  nome: string;
  cargo: string;
  papelNoProjeto: PapelEquipe;
  email?: string;
  telefone?: string;
  horasDedicadasSemana: number;
  permissao: 'Administrador' | 'Gerente' | 'Colaborador' | 'Cliente / Visualizador';
  dataEntrada: string;
  status: 'Ativo' | 'Alocado Parcial' | 'Encerrado';
}

export interface ProjectTimeEntry {
  id: string;
  projetoId: string;
  taskId?: string;
  taskTitulo?: string;
  sprintId?: string;
  colaboradorNome: string;
  colaboradorId?: string;
  data: string;
  horas: number;
  descricao: string;
  faturavel: boolean;
  criadoEm: string;
}

export type CategoriaDocProjeto = 
  | 'Comercial' 
  | 'Planejamento' 
  | 'Requisitos' 
  | 'Design' 
  | 'Desenvolvimento' 
  | 'Testes' 
  | 'Entrega';

export interface ProjectDocumentMeta {
  id: string;
  projetoId: string;
  nome: string;
  categoria: CategoriaDocProjeto;
  tamanho: string;
  urlConteudo?: string;
  autor: string;
  dataUpload: string;
}

export type StatusEntrega = 
  | 'Planejada' 
  | 'Em Desenvolvimento' 
  | 'Pronta para Validação' 
  | 'Aprovada' 
  | 'Entregue';

export interface ProjectDeliverable {
  id: string;
  projetoId: string;
  marcoId?: string;
  sprintId?: string;
  nome: string;
  descricao: string;
  dataPrevista: string;
  dataEntrega?: string;
  status: StatusEntrega;
  responsavel: string;
  linkEntrega?: string;
  documentoUrl?: string;
  aprovadoPor?: string;
}

export type NivelRisco = 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
export type StatusRisco = 'Identificado' | 'Em Monitoramento' | 'Mitigado' | 'Ocorrido / Bloqueado';

export interface ProjectRisk {
  id: string;
  projetoId: string;
  taskId?: string;
  titulo: string;
  descricao: string;
  probabilidade: 'Baixa' | 'Média' | 'Alta';
  impacto: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  nivelRisco: NivelRisco;
  responsavel: string;
  planoMitigacao: string;
  status: StatusRisco;
  criadoEm: string;
}

export interface ProjectActivityLog {
  id: string;
  projetoId: string;
  usuarioNome: string;
  acao: string;
  entidade: string;
  detalhes?: string;
  dataHora: string;
}

export interface KanbanColumnConfig {
  id: string;
  titulo: string;
  statusMapped: StatusTask;
  corBadge: string;
}
