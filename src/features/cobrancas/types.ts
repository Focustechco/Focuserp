export type StatusCobranca = "Pendente" | "Agendada" | "Enviada" | "Entregue" | "Lida" | "Respondida" | "Paga" | "Vencida" | "Cancelada" | "Falha no envio";
export type StatusEntrega = "Pendente" | "Enviado" | "Entregue" | "Falhou";
export type StatusLeitura = "Não lida" | "Lida";
export type CanalEnvio = "WhatsApp" | "E-mail" | "SMS";
export type TipoResposta = "Dúvida" | "Solicitação de boleto" | "Solicitação de PIX" | "Contestação" | "Promessa de pagamento" | "Confirmação de pagamento" | "Outros";

export interface EventoTimeline {
  id: string;
  dataHora: string; // ISO Datetime
  usuario: string;
  canal?: CanalEnvio;
  acao: string; // ex: Criação, Envio, Entrega, Leitura, Resposta, Pagamento
  detalhes?: string;
}

export interface Cobranca {
  id: string;
  cliente: string;
  clienteNome?: string;
  clienteId?: string;
  tituloId?: string;
  tituloReferencia: string;
  valor: number;
  valorTotal?: number;
  vencimento: string; // ISO Date
  dataVencimento?: string;
  canal: CanalEnvio[];
  dataHoraEnvio?: string; // ISO Datetime
  dataHoraPagamento?: string; // ISO Datetime
  
  statusCobranca: StatusCobranca;
  statusEntrega: StatusEntrega;
  statusLeitura: StatusLeitura;
  status?: string;
  
  diasAtraso?: number;
  etapaAtual?: string;
  responsavel: string;
  
  // Conteúdo gerado/anexado
  mensagemPersonalizada?: string;
  pixCopiaECola?: string;
  qrCodePix?: string; // URL da imagem ou base64
  linhaDigitavel?: string;
  linkBoleto?: string; // URL
  
  // Agendamento
  agendamento?: string; // ISO Datetime
  lembretesProgramados?: string[];
  
  // Resposta
  respostaCliente?: string;
  classificacaoResposta?: TipoResposta;
  
  timeline: EventoTimeline[];
  historicoInteracoes?: any[];
}
