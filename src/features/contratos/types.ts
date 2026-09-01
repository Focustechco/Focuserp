export type CategoriaContrato = 'Receita' | 'Despesa' | 'Interno';
export type EntidadeVinculo = 'Cliente' | 'Fornecedor' | 'Projeto' | 'Parceiro' | 'Focus Tecnologia' | 'Colaborador';
export type StatusContrato = 'Em Elaboração' | 'Em Revisão' | 'Aguardando Assinatura' | 'Assinado' | 'Vigente' | 'Encerrado' | 'Renovado' | 'Cancelado' | 'Suspenso';
export type TipoServicoContrato = 'Desenvolvimento de Software' | 'Sistema Web' | 'Aplicativo Mobile' | 'Automação' | 'Consultoria' | 'Suporte Técnico' | 'Licenciamento' | 'Prestação de Serviço' | 'Cloud' | 'Marketing' | 'Jurídico' | 'Contabilidade' | 'NDA' | 'Parceria' | 'Outros';

export interface Aditivo {
  id: string;
  numero: string;
  tipo: string;
  motivo: string;
  valorAlterado: number; // Pode ser negativo para descontos
  novaVigencia?: string; // ISO Date
  data: string; // ISO Date
  responsavel: string;
}

export interface Assinatura {
  id: string;
  parte: 'Contratante' | 'Contratada';
  representante: string;
  cargo: string;
  documento: string; // CPF
  dataAssinatura?: string; // ISO Date
  status: 'Pendente' | 'Assinado';
}

export interface Contrato {
  id: string;
  codigo: string;
  numeroContrato: string;
  nome: string;
  
  categoria: CategoriaContrato;
  tipoServico: TipoServicoContrato;
  
  // Vínculos MDM (Foreign Keys simuladas)
  entidadeVinculo: EntidadeVinculo;
  titularidade?: 'Cliente' | 'Focus Tecnologia';
  clienteId?: string;
  clienteNome?: string;
  fornecedorId?: string;
  fornecedorNome?: string;
  contraparteNome?: string;
  projetoId?: string;
  
  responsavelInterno: string;
  departamento: string;
  status: StatusContrato;
  descricao: string;

  // Vigência
  dataAssinatura?: string; // ISO Date
  dataInicial: string; // ISO Date
  dataFinal: string; // ISO Date
  renovacaoAutomatica: boolean;
  
  // Valores e Condições
  valorTotal: number;
  valorImplantacao: number;
  valorMensalidade: number;
  formaPagamento?: string;
  diaVencimento?: string | number;
  condicaoPagamento?: string;
  observacoesFinanceiras?: string;
  mesesVigencia?: number;
  reajuste?: string;
  indiceCorrecao?: 'IPCA' | 'IGP-M' | 'INPC' | 'Nenhum';
  multaPercentual: number;
  jurosAoMes: number;
  
  aditivos: Aditivo[];
  assinaturas: Assinatura[];

  arquivoUrl?: string;
  arquivoNome?: string;

  dataCriacao: string; // ISO Date
  ultimaAtualizacao: string; // ISO Date
}
