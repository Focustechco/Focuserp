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

export interface ProjetoMilestone {
  id: string;
  projetoId: string;
  titulo: string;
  descricao?: string;
  dataPrevisao: string;
  dataConclusao?: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Atrasado';
  percentualProgresso?: number;
  responsavel?: string;
  entregavel?: string;
  criadoEm?: string;
}

export interface ProjetoEtapa {
  id: string;
  projetoId: string;
  nome: string;
  fase: 'Planejamento' | 'Design & UX' | 'Desenvolvimento Core' | 'Integrações & APIs' | 'Testes & QA' | 'Homologação' | 'Implantação' | 'Go-Live';
  dataInicio: string;
  dataFim: string;
  responsavel: string;
  progresso: number; // 0-100
  status: 'Não Iniciado' | 'Em Andamento' | 'Concluído' | 'Bloqueado';
  horasEstimadas: number;
  horasApontadas: number;
  dependencia?: string;
}

export interface ProjetoMembroEquipe {
  id: string;
  projetoId: string;
  usuarioId?: string;
  nome: string;
  cargo: string;
  papelNoProjeto: 'Gerente de Projeto (PM)' | 'Tech Lead' | 'Desenvolvedor Frontend' | 'Desenvolvedor Backend' | 'Fullstack Engineer' | 'UI/UX Designer' | 'QA Tester' | 'DevOps & Cloud' | 'Product Owner (PO)' | 'Consultor Técnico';
  email?: string;
  telefone?: string;
  horasDedicadasSemana: number;
  dataEntrada: string;
  status: 'Ativo' | 'Alocado Parcial' | 'Encerrado';
}

export interface Projeto {
  id: string;
  codigo: string;
  nome: string;
  idCliente: string; // Relacionamento com Clientes
  idContrato?: string; 
  tipo: TipoProjeto;
  categoria: string;
  responsavelPrincipal: string;
  prioridade: PrioridadeProjeto;
  status: StatusProjeto;
  dataInicio: string; // ISO Date
  dataFinal: string; // ISO Date
  descricaoGeral: string;
  
  // Escopo
  objetivo?: string;
  escopoIncluido?: string;
  escopoExcluido?: string;

  // Dados Consolidados (Cálculos e Módulos Financeiros)
  valorContratado: number;
  valorRecebido: number;
  saldoRestante: number;
  
  progressoGlobal: number; // 0-100
  
  horasPlanejadas: number;
  horasRealizadas: number;

  ultimaAtualizacao: string; // ISO Date
}
