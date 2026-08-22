export type ModuloOrigemDMS = 
  | 'Clientes' 
  | 'Projetos' 
  | 'RH' 
  | 'Produtos Focus' 
  | 'Relatórios' 
  | 'Financeiro' 
  | 'Fiscal' 
  | 'Contratos' 
  | 'Fornecedores' 
  | 'Marketing' 
  | 'Comercial' 
  | 'CRM'
  | 'Geral';

export type FormatoArquivo = 
  | 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'csv' 
  | 'ppt' | 'pptx' | 'txt' | 'xml' | 'jpg' | 'png' 
  | 'svg' | 'zip' | 'rar' | 'mp4' | 'mov' | 'mp3' | 'outros';

export interface VersaoDocumento {
  numeroVersao: string; // Ex: '1.0', '1.1', '2.0'
  alteradoPor: string;
  dataAlteracao: string; // ISO String
  descricaoAlteracao: string;
  tamanhoArquivo: string;
  urlDownload?: string;
}

export interface PastaDMS {
  id: string;
  nome: string;
  parentId: string | null; // null se for raiz
  caminhoCompleto: string; // Ex: /Clientes/Focus Tecnologia
  moduloVinculado?: ModuloOrigemDMS;
  entidadeId?: string; // ID do Cliente, Projeto, Produto, etc.
  dataCriacao: string;
  criadoPor: string;
  corIcone?: string;
}

export interface DocumentoDMS {
  id: string;
  codigo: string; // Ex: DOC-90182
  nome: string;
  extensao: FormatoArquivo;
  tamanho: string;
  tamanhoBytes: number;
  pastaId: string;
  caminhoPasta: string;
  moduloOrigem: ModuloOrigemDMS;
  
  // Vinculações MDM Multi-módulo
  clienteId?: string;
  clienteNome?: string;
  projetoId?: string;
  projetoNome?: string;
  contratoId?: string;
  contratoNumero?: string;
  colaboradorId?: string;
  colaboradorNome?: string;
  produtoId?: string;
  produtoNome?: string;
  relatorioTipo?: string;
  entidadeTipo?: 'cliente' | 'projeto' | 'colaborador' | 'produto' | 'relatorio' | 'contrato' | 'geral';
  
  tags: string[];
  categoria: string;
  responsavelUpload: string;
  dataUpload: string;
  dataUltimaAlteracao: string;
  versaoAtual: string;
  favorito: boolean;
  status: 'Ativo' | 'Arquivado' | 'Em Revisão';
  
  // Versionamento
  historicoVersoes: VersaoDocumento[];
  
  // URL de conteúdo Base64 ou Cloud Storage
  urlConteudo?: string;
}

export interface AuditLogDocumento {
  id: string;
  documentoId: string;
  nomeDocumento: string;
  usuario: string;
  acao: 'Upload' | 'Download' | 'Visualização' | 'Renomeação' | 'Exclusão' | 'Restauração' | 'Versão Criada' | 'Compartilhamento';
  dataHora: string;
  ip: string;
  detalhes?: string;
}

export interface DMSMetricas {
  totalDocumentos: number;
  totalPastas: number;
  espacoUtilizadoBytes: number;
  espacoUtilizadoFormatado: string;
  documentosPorModulo: Record<ModuloOrigemDMS, number>;
  documentosRecentes: DocumentoDMS[];
}
