export type FuncaoComercial = 
  | 'SDR' 
  | 'BDR' 
  | 'Consultor Comercial' 
  | 'Closer' 
  | 'Executivo de Contas' 
  | 'Gerente Comercial' 
  | 'Diretor Comercial';

export type TipoMeta = 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';

export type StatusProposta = 
  | 'Em elaboração' 
  | 'Em revisão' 
  | 'Aguardando aprovação' 
  | 'Enviada' 
  | 'Visualizada'
  | 'Em negociação'
  | 'Aprovada' 
  | 'Recusada' 
  | 'Cancelada';

export type TipoAtividade = 
  | 'Ligação' 
  | 'WhatsApp' 
  | 'E-mail' 
  | 'Reunião' 
  | 'Follow-up' 
  | 'Visita' 
  | 'Demonstração' 
  | 'Outro';

export type ResultadoAtividade = 
  | 'Positivo / Avançou' 
  | 'Diagnóstico Agendado' 
  | 'Proposta Solicitada' 
  | 'Aguardando Retorno' 
  | 'Sem Contato / Caixa Postal' 
  | 'Sem Interesse' 
  | 'Reunião Realizada';

export interface AtividadeComercial {
  id: string;
  responsavel: string;
  responsavelAvatar?: string;
  empresa: string;
  contato: string;
  oportunidadeId?: string;
  tipo: TipoAtividade;
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  duracaoMinutos?: number;
  resultado: ResultadoAtividade;
  observacoes: string;
  proximaAcao?: string;
  dataProximoFollowUp?: string;
}

export interface AgendaComercialItem {
  id: string;
  tipo: 'Follow-up Atrasado' | 'Reunião Hoje' | 'Lead para Contatar' | 'Proposta Aguardando' | 'Tarefa Prioritária';
  titulo: string;
  cliente: string;
  contato?: string;
  horario?: string;
  data: string;
  responsavel: string;
  status: 'Pendente' | 'Concluído';
  prioridade: 'Urgente' | 'Alta' | 'Média';
  oportunidadeId?: string;
}

export interface MembroEquipeComercial {
  id: string;
  colaboradorRhId?: string;
  nome: string;
  email: string;
  avatarUrl?: string;
  funcao: FuncaoComercial;
  supervisor?: string;
  metaMensalR$: number;
  metaContratos?: number;
  comissaoPercentual: number;
  resultadoRealizadoR$: number;
  status: 'Ativo' | 'Inativo';
}

export interface MetaComercial {
  id: string;
  titulo: string;
  tipo: TipoMeta;
  aplicadaA: string; // Nome do colaborador ou "Equipe Geral"
  categoriaTarget: 'Receita Total' | 'Quantidade de Vendas' | 'Contratos Recorrentes' | 'Propostas Enviadas' | 'Contatos / Follow-ups';
  valorMeta: number; // R$ ou Quantidade
  valorRealizado: number;
  periodo: string; // Ex: "Março 2026", "Q1 2026"
  status: 'Em Andamento' | 'Atingida' | 'Em Risco' | 'Superada';
}

export interface OkrComercial {
  id: string;
  objetivo: string;
  keyResult: string;
  responsavel: string;
  periodo: string;
  percentualConclusao: number; // 0-100
  status: 'No Prazo' | 'Atenção' | 'Atrasado' | 'Concluído';
}

export interface RegraComissao {
  id: string;
  titulo: string;
  funcaoOuConsultor: string;
  tipo: 'Percentual' | 'Valor Fixo' | 'Escalonado';
  aliquotaPercentual: number;
  valorFixoR$?: number;
  criterioLiberacao: 'Na Assinatura' | 'No Pagamento da 1ª Parcela' | 'Mensal Recorrente';
  status: 'Ativa' | 'Inativa';
}

export interface RegistroComissao {
  id: string;
  vendaId: string;
  clienteNome: string;
  consultorNome: string;
  valorVendaR$: number;
  percentualAplicado: number;
  valorComissaoR$: number;
  dataFechamento: string;
  dataPagamentoPrevista: string;
  status: 'Prevista' | 'Aprovada' | 'Paga';
}

export interface ScriptVenda {
  id: string;
  titulo: string;
  categoria: 
    | 'Primeiro Contato' 
    | 'WhatsApp' 
    | 'Ligação Fria / Cold Call' 
    | 'Follow-up' 
    | 'Qualificação' 
    | 'Apresentação & Pitch' 
    | 'Contorno de Objeções' 
    | 'Negociação' 
    | 'Fechamento' 
    | 'Pós-Reunião';
  objetivo: string;
  conteudo: string;
  tags: string[];
  autor: string;
  dataAtualizacao: string;
  favorito?: boolean;
}

export interface EstrategiaComercial {
  id: string;
  titulo: string;
  categoria: 
    | 'Prospecção Outbound' 
    | 'Inbound & Nutrição' 
    | 'Social Selling' 
    | 'Account-Based Marketing (ABM)' 
    | 'Follow-up de Alto Impacto' 
    | 'Negociação Avançada' 
    | 'Fechamento & Urgência' 
    | 'Expansão de Carteira (Upsell)';
  objetivo: string;
  publicoAlvo: string;
  quandoUtilizar: string;
  etapas: string[];
  checklist: Array<{ item: string; concluido?: boolean }>;
  responsavel: string;
}

export interface PlaybookComercial {
  id: string;
  titulo: string;
  funcaoAlvo: 'SDR' | 'Closer' | 'Consultor Geral' | 'Executivo Enterprise';
  descricao: string;
  etapasDoProcesso: Array<{
    titulo: string;
    instrucoes: string;
    ferramentasRecomendadas?: string[];
  }>;
  checklists: string[];
  documentosAnexos?: Array<{ nome: string; url: string }>;
}

export interface ProdutoComercial {
  id: string;
  codigo: string; // Ex: PRD-001
  nome: string;
  categoria: 'ERP' | 'CRM' | 'BI' | 'Automação' | 'Aplicativo' | 'Portal' | 'Consultoria';
  descricao: string;
  precoBaseR$: number;
  precoMinimoR$: number;
  precoSugeridoR$: number;
  tipoCobranca: 'Mensal Recorrente (SaaS)' | 'Pagamento Único' | 'Setup + Mensalidade';
  status: 'Ativo' | 'Descontinuado';
}

export interface ServicoComercial {
  id: string;
  codigo: string; // Ex: SRV-001
  nome: string;
  categoria: 'Desenvolvimento' | 'Implantação' | 'Treinamento' | 'Consultoria' | 'Suporte' | 'Discovery';
  descricao: string;
  precoR$: number;
  tempoMedio: string; // Ex: "40 horas"
  status: 'Ativo' | 'Inativo';
}

export interface TabelaPreco {
  id: string;
  nome: string;
  descontoPadraoPercentual: number;
  acrescimoPadraoPercentual: number;
  validade: string;
  status: 'Ativa' | 'Expirada';
}

export interface ItemProposta {
  id: string;
  nomeItem: string;
  tipo: 'Produto' | 'Serviço';
  quantidade: number;
  valorUnitarioR$: number;
  valorTotalR$: number;
}

export interface PropostaComercial {
  id: string;
  numero: string; // Ex: PROP-2026-001
  clienteId: string;
  clienteNome: string;
  contatoNome: string;
  contatoEmail?: string;
  contatoTelefone?: string;
  responsavel: string;
  itens: ItemProposta[];
  valorTotalR$: number;
  descontoR$: number;
  valorFinalR$: number;
  condicoesPagamento: string;
  validadeDias: number;
  dataCriacao: string;
  dataEnvio?: string;
  dataAprovacao?: string;
  status: StatusProposta;
  observacoes?: string;
}
