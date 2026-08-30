export type TipoFornecedor = 'Pessoa Física' | 'Pessoa Jurídica';
export type StatusFornecedor = 'Ativo' | 'Inativo' | 'Homologado' | 'Em Análise' | 'Bloqueado';
export type CategoriaFornecedor = 
  | 'Desenvolvimento de Software' 
  | 'Cloud' 
  | 'Infraestrutura' 
  | 'Equipamentos' 
  | 'Marketing' 
  | 'Contabilidade' 
  | 'Jurídico' 
  | 'Consultoria' 
  | 'Recursos Humanos' 
  | 'Licenciamento' 
  | 'Hospedagem' 
  | 'Telefonia' 
  | 'Internet' 
  | 'Energia' 
  | 'Financeiro' 
  | 'Serviços'
  | 'Geral'
  | 'Outros';

export interface ContatoFornecedor {
  id: string;
  nome: string;
  cargo?: string;
  departamento?: string;
  telefone?: string;
  celular: string;
  whatsapp: boolean;
  email: string;
  principal: boolean;
}

export interface EnderecoFornecedor {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string; // UF
  pais: string;
}

export interface DadosBancarios {
  id: string;
  banco: string;
  codigoBanco?: string;
  agencia: string;
  conta: string;
  digitoConta?: string;
  tipoConta: 'Corrente' | 'Poupança' | 'Pagamento';
  tipoChavePix?: 'CNPJ' | 'CPF' | 'E-mail' | 'Telefone' | 'Chave Aleatória';
  chavePix?: string;
  favorecido: string;
  documentoFavorecido: string; // CPF ou CNPJ
  principal: boolean;
}

export interface Fornecedor {
  id: string;
  codigo: string;
  tipo: TipoFornecedor;
  razaoSocial: string;
  nomeFantasia: string;
  documento: string; // CPF ou CNPJ
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  categoria: CategoriaFornecedor | string;
  segmento?: string;
  porte?: string;
  status: StatusFornecedor;
  site?: string;
  observacoes?: string;
  
  contatos: ContatoFornecedor[];
  endereco: EnderecoFornecedor;
  dadosBancarios: DadosBancarios[];

  // Condições Comerciais & Pagamento
  condicaoPagamentoPadrao?: string;
  formaPagamentoPadrao?: string;
  prazoPagamentoDias?: number;

  // Documentos anexados
  documentos?: any[];

  // Financeiro (Consolidado - Contas a pagar)
  totalContratado: number;
  totalPago: number;
  saldoAberto: number;
  
  dataCadastro: string; // ISO String
  ultimaAtualizacao: string; // ISO String
}

