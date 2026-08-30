export type EtapaPipeline = string;
export type PrioridadeOportunidade = 'Baixa' | 'Média' | 'Alta' | 'Urgente' | string;

export interface ClickUpStatusItem {
  status: string;
  color: string;
  orderindex?: number;
  type?: string;
}

export interface ClickUpSyncConfig {
  id: string;
  apiToken: string;
  teamId?: string;
  teamName?: string;
  workspaceId?: string;
  spaceId?: string;
  spaceName?: string;
  listId?: string;
  listName?: string;
  autoSync: boolean;
  lastSyncTime: string;
  statusConexao: 'Conectado ClickUp API' | 'Sincronizando' | 'Desconectado' | 'Erro';
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
  listStatuses?: ClickUpStatusItem[];
}

export interface LeadCrm {
  id: string;
  clickUpTaskId: string; // Ex: "CU-869201"
  nome: string;
  empresa: string;
  telefone: string;
  whatsapp: string;
  email: string;
  origem: 'Inbound Website' | 'Outbound BDR' | 'Indicação' | 'Campanha Meta/Google' | 'Evento';
  responsavel: string;
  status: 'Novo Lead' | 'Em Contato' | 'Qualificado' | 'Desqualificado';
  score: number; // 0-100
  cidade: string;
  estado: string;
  dataCriacao: string;
  observacoes?: string;
}

export interface EmpresaCrm {
  id: string;
  clickUpTaskId?: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  segmento: string;
  cidade: string;
  estado: string;
  website: string;
  responsavel: string;
  observacoes?: string;
  receitaEstimada?: number;
}

export interface ContatoCrm {
  id: string;
  clickUpTaskId?: string;
  nome: string;
  cargo: string;
  empresa: string;
  telefone: string;
  whatsapp: string;
  email: string;
  linkedin?: string;
  responsavel: string;
}

export interface OportunidadeCrm {
  id: string;
  clickUpTaskId: string; // ID da tarefa no ClickUp (Ex: "CU-94821")
  titulo: string;
  empresaId?: string;
  empresaNome: string;
  contatoNome: string;
  contatoEmail?: string;
  contatoTelefone?: string;
  valorR$: number; // Valor real (0 se não informado no ClickUp ou editável manualmente)
  probabilidadePercent: number; // 0-100
  responsavel: string;
  responsavelAvatar?: string;
  pipeline: string; // Nome da lista / quadro ClickUp
  etapa: string; // Status exato do ClickUp (ex: "TO DO", "IN PROGRESS", etc.)
  statusColor?: string; // Cor exata do status no ClickUp (#hex)
  statusOrder?: number;
  prioridade: PrioridadeOportunidade;
  tags: string[];
  dataPrevistaFechamento: string;
  dataCriacao: string;
  proximaAcao: string;
  statusClickUp: 'synced' | 'pending' | 'error';
  observacoes?: string;
  clickUpUrl?: string;
}

export interface AtividadeCrm {
  id: string;
  clickUpTaskId?: string;
  tipo: 'Ligação' | 'WhatsApp' | 'Reunião' | 'Follow-up' | 'Apresentação';
  titulo: string;
  dataHora: string;
  responsavel: string;
  status: 'Pendente' | 'Concluída';
}

export interface LogSyncClickUp {
  id: string;
  timestamp: string;
  clickUpTaskId: string;
  entidade: 'Oportunidade' | 'Lead' | 'Empresa' | 'Contato';
  acao: string;
  status: 'Sucesso' | 'Pendente' | 'Erro';
  mensagem: string;
}
