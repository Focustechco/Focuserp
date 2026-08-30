export type TipoCliente = 'Pessoa Física' | 'Pessoa Jurídica';
export type StatusCliente = 'Ativo' | 'Inativo';

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
}

export interface Contato {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  telefone?: string;
  celular: string;
  whatsapp: boolean;
  email: string;
  principal: boolean;
}

export interface Cliente {
  id: string;
  codigo: string;
  tipo: TipoCliente;
  razaoSocial: string;
  nomeFantasia: string;
  documento: string; // CPF ou CNPJ
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  dataFundacaoNascimento?: string;
  status: StatusCliente;
  segmento: string;
  porteEmpresa?: string;
  site?: string;
  observacoes?: string;
  endereco: Endereco;
  contatos: Contato[];
  dataCadastro: string; // ISO Date
  ultimaAtualizacao: string; // ISO Date
  documentos?: Array<{
    id: string;
    nome: string;
    tamanho: string;
    tamanhoBytes?: number;
    dataUpload: string;
    urlConteudo?: string;
    categoria?: string;
  }>;
  recorrencias?: any[];
}
