export type CategoriaEquipamento =
  | 'Notebook'
  | 'Monitor'
  | 'Desktop'
  | 'Celular'
  | 'Tablet'
  | 'Impressora'
  | 'Servidor'
  | 'Switch'
  | 'Nobreak'
  | 'Mouse'
  | 'Teclado'
  | 'Headset'
  | 'Webcam'
  | 'Dock Station'
  | 'Outros';

export type SituacaoEquipamento = 'Disponível' | 'Em Uso' | 'Manutenção' | 'Baixa';

export interface NotebookSpecs {
  processador?: string;
  memoriaRam?: string;
  armazenamento?: string;
  sistemaOperacional?: string;
  nomeEquipamento?: string;
  serviceTag?: string;
  macAddress?: string;
  fabricante?: string;
}

export interface MonitorSpecs {
  polegadas?: string;
  resolucao?: string;
  tipoPainel?: string;
  conexoes?: string[];
}

export interface EquipamentoTimelineEvent {
  id: string;
  dataHora: string;
  tipo: 'Aquisição' | 'Alteração' | 'Manutenção' | 'Mudança Responsável' | 'Mudança Setor' | 'Troca Localização' | 'Atualização' | 'Baixa';
  descricao: string;
  responsavel?: string;
  origem?: string;
  destino?: string;
  usuarioRegistro?: string;
}

export interface Equipamento {
  id: string;
  codigoPatrimonial: string;
  categoria: CategoriaEquipamento;
  marca: string;
  modelo: string;
  numeroSerie: string;
  dataAquisicao: string; // YYYY-MM-DD
  valorCompra: number;
  garantiaMeses?: number;
  situacao: SituacaoEquipamento;
  departamento?: string;
  centroCustoId?: string;
  colaboradorId?: string;
  colaboradorNome?: string;
  localFisica: string;
  observacoes?: string;
  notebookSpecs?: NotebookSpecs;
  monitorSpecs?: MonitorSpecs;
  timeline?: EquipamentoTimelineEvent[];
  createdAt?: string;
  updatedAt?: string;
}

export type EstadoConservacaoItem = 'Novo' | 'Excelente' | 'Bom' | 'Desgastado' | 'Danificado' | 'Em Manutenção';

export interface EstoqueItem {
  id: string;
  codigo: string;
  nome: string; // Título / Nome do item
  descricao?: string; // Descrição detalhada do item (livro, alexa, tv, etc.)
  categoria: string;
  quantidade: number; // Unidades
  quantidadeMinima?: number;
  estadoConservacao?: EstadoConservacaoItem; // Estado de conservação
  localizacao: string; // Sala / Localização no escritório
  status: 'Disponível' | 'Reservado' | 'Em Uso' | 'Emprestado' | 'Manutenção' | 'Baixado';
  valorUnitario?: number;
  responsavelId?: string;
  responsavelNome?: string;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Licenca {
  id: string;
  nome: string;
  fabricante: string;
  plano: string;
  tipo: 'Perpétua' | 'Assinatura';
  quantidadeTotal: number;
  quantidadeUsada: number;
  quantidadeDisponivel: number;
  dataCompra: string;
  vencimento: string;
  valor: number;
  responsavelId?: string;
  responsavelNome?: string;
  centroCustoId?: string;
  centroCustoNome?: string;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Patrimonio {
  id: string;
  numeroPatrimonial: string;
  codigoInterno: string;
  categoria: string;
  valorCompra: number;
  valorAtual: number;
  vidaUtilAnos: number;
  depreciacaoAcumulada: number;
  estadoConservacao: 'Bom' | 'Regular' | 'Ruim' | 'Obsoleto';
  situacao: 'Ativo' | 'Baixado' | 'Descarte';
  centroCustoId?: string;
  centroCustoNome?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Movimentacao {
  id: string;
  tipo: 'Entrada' | 'Saída' | 'Transferência' | 'Manutenção' | 'Baixa' | 'Descarte' | 'Alteração Responsável' | 'Alteração Local';
  equipamentoId?: string;
  equipamentoNome?: string;
  estoqueItemId?: string;
  estoqueItemNome?: string;
  usuarioId: string;
  usuarioNome: string;
  dataHora: string;
  origem?: string;
  destino?: string;
  responsavelId?: string;
  responsavelNome?: string;
  observacoes?: string;
}

export interface InventarioItem {
  itemId: string;
  nome: string;
  codigo: string;
  quantidadeEsperada: number;
  quantidadeFisica: number;
  divergencia: number;
  estado: string;
  localizacao: string;
}

export interface Inventario {
  id: string;
  titulo: string;
  dataInicio: string;
  dataFim?: string;
  status: 'Em Progresso' | 'Concluído' | 'Pendente';
  responsavelId: string;
  responsavelNome: string;
  localizacao: string;
  divergenciasCount: number;
  perdasCount: number;
  danificadosCount: number;
  itens: InventarioItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Manutencao {
  id: string;
  equipamentoId: string;
  equipamentoCodigo: string;
  equipamentoNome: string;
  tipo: 'Preventiva' | 'Corretiva' | 'Upgrade' | 'Troca';
  data: string;
  descricao: string;
  valor: number;
  responsavelId: string;
  responsavelNome: string;
  status: 'Aberta' | 'Em Execução' | 'Concluída' | 'Cancelada';
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}
