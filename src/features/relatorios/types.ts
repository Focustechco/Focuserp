export type ReportCategory = 
  | 'Financeiro' 
  | 'Comercial' 
  | 'CRM' 
  | 'Clientes' 
  | 'Projetos' 
  | 'RH' 
  | 'Marketing' 
  | 'Fiscal';

export type ReportFormat = 'PDF' | 'DOCX' | 'XLSX' | 'CSV';

export type ScheduleFrequency = 'Diário' | 'Semanal' | 'Mensal' | 'Trimestral' | 'Anual';

export interface ReportColumn {
  key: string;
  label: string;
  type: 'text' | 'currency' | 'date' | 'number' | 'badge';
  defaultVisible?: boolean;
}

export interface ReportDefinition {
  id: string;
  title: string;
  category: ReportCategory;
  description: string;
  iconName: string;
  tags: string[];
  recommendedFor: string;
  columns: ReportColumn[];
  availableFilters: Array<'periodo' | 'cliente' | 'projeto' | 'status' | 'categoria' | 'responsavel' | 'centroCusto'>;
}

export interface ReportFilterConfig {
  dataInicio: string;
  dataFim: string;
  empresa: string;
  clienteId?: string;
  projetoId?: string;
  departamento?: string;
  centroCustoId?: string;
  status?: string;
  ordenacao?: string;
  agrupamento?: string;
  colunasSelecionadas: string[];
  incluirGraficos: boolean;
  incluirResumoExecutivo: boolean;
  observacoesPersonalizadas?: string;
}

export interface ReportExecutionHistory {
  id: string;
  reportId: string;
  reportTitle: string;
  category: ReportCategory;
  generatedBy: string;
  generatedAt: string; // ISO string
  format: ReportFormat;
  fileSize: string;
  generationTimeMs: number;
  status: 'Sucesso' | 'Processando' | 'Falha';
  filtersSummary: string;
  downloadUrl?: string;
}

export interface ReportSchedule {
  id: string;
  reportId: string;
  reportTitle: string;
  category: ReportCategory;
  frequency: ScheduleFrequency;
  horario: string;
  responsavel: string;
  destinatarions: string[];
  format: ReportFormat;
  proximaExecucao: string;
  status: 'Ativo' | 'Pausado';
}

export interface ReportModelTemplate {
  id: string;
  title: string;
  category: ReportCategory;
  description: string;
  isDefault: boolean;
  createdBy: string;
  reportId: string;
  filterDefaults: Partial<ReportFilterConfig>;
}

export interface ReportHierarchyGroup {
  groupTitle: string;
  groupSubtitle?: string;
  groupBadge?: string;
  rows: Array<Record<string, any>>;
  subtotals?: Array<{ label: string; value: string; color?: string }>;
}

export interface GeneratedReportData {
  definition: ReportDefinition;
  filters: ReportFilterConfig;
  generatedAt: string;
  reportNumber: string;
  metricsSummary: Array<{ label: string; value: string; color?: string }>;
  rows: Array<Record<string, any>>;
  hierarchicalGroups?: ReportHierarchyGroup[];
  grandTotals?: Array<{ label: string; value: string; color?: string }>;
  chartData?: Array<{ name: string; valor: number }>;
}

