import { Cobranca } from "./types";

export const INITIAL_COBRANCAS: Cobranca[] = [
  {
    id: "COB-1001",
    cliente: "Tech Solutions Ltda",
    tituloReferencia: "REC-1011",
    valor: 5400.00,
    vencimento: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    canal: ["WhatsApp", "E-mail"],
    dataHoraEnvio: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
    statusCobranca: "Respondida",
    statusEntrega: "Entregue",
    statusLeitura: "Lida",
    responsavel: "Sistema Automatizado",
    mensagemPersonalizada: "Olá Tech Solutions! Sua fatura REC-1011 no valor de R$ 5.400,00 venceu recentemente. Segue a chave PIX e o boleto atualizado para pagamento sem acréscimos.",
    pixCopiaECola: "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-42661417400052040000530398654055400.005802BR5913FOCUS ERP6009SAO PAULO62070503***6304E2CA",
    linhaDigitavel: "34191.79001 01043.510047 91020.150008 8 98760000540000",
    linkBoleto: "https://focuserp.com.br/boletos/REC-1011.pdf",
    respostaCliente: "Olá! Já encaminhei para o nosso setor financeiro realizar o pagamento hoje via PIX.",
    classificacaoResposta: "Promessa de pagamento",
    timeline: [
      {
        id: "t-1",
        dataHora: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        usuario: "Sistema Focus",
        canal: "WhatsApp",
        acao: "Disparo Automático",
        detalhes: "Régua D+2 acionada para o título REC-1011."
      },
      {
        id: "t-2",
        dataHora: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 120000).toISOString(),
        usuario: "WhatsApp Gateway",
        canal: "WhatsApp",
        acao: "Mensagem Entregue",
        detalhes: "Notificação entregue com sucesso no número +55 (11) 98765-4321."
      },
      {
        id: "t-3",
        dataHora: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 450000).toISOString(),
        usuario: "Cliente (Tech Solutions)",
        canal: "WhatsApp",
        acao: "Mensagem Lida",
        detalhes: "O cliente abriu a mensagem e visualizou o código PIX."
      },
      {
        id: "t-4",
        dataHora: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
        usuario: "Cliente (Tech Solutions)",
        canal: "WhatsApp",
        acao: "Resposta do Cliente",
        detalhes: "Já encaminhei para o nosso setor financeiro realizar o pagamento hoje via PIX."
      }
    ]
  },
  {
    id: "COB-1002",
    cliente: "Indústria Global S.A.",
    tituloReferencia: "REC-1025",
    valor: 12850.00,
    vencimento: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    canal: ["WhatsApp", "E-mail", "SMS"],
    dataHoraEnvio: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    statusCobranca: "Enviada",
    statusEntrega: "Entregue",
    statusLeitura: "Lida",
    responsavel: "Mariana Controller",
    mensagemPersonalizada: "Prezados da Indústria Global, lembramos que a fatura REC-1025 de R$ 12.850,00 vence amanhã. Acesse o boleto em anexo ou pague via PIX com desconto de pontualidade.",
    pixCopiaECola: "00020126580014br.gov.bcb.pix0136987e6543-e89b-12d3-a456-426614174000520400005303986540512850.005802BR5913FOCUS ERP6009SAO PAULO62070503***63048A1B",
    linhaDigitavel: "23793.38128 60000.123456 01000.654321 1 98800001285000",
    linkBoleto: "https://focuserp.com.br/boletos/REC-1025.pdf",
    timeline: [
      {
        id: "t-201",
        dataHora: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        usuario: "Mariana Controller",
        canal: "E-mail",
        acao: "Disparo de Lembrete Pré-Vencimento (D-1)",
        detalhes: "Envio de fatura, boleto e chave PIX para financeiro@industriaglobal.com.br."
      },
      {
        id: "t-202",
        dataHora: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        usuario: "WhatsApp Gateway",
        canal: "WhatsApp",
        acao: "Entregue e Lido",
        detalhes: "Mensagem visualizada pelo gestor de contas."
      }
    ]
  },
  {
    id: "COB-1003",
    cliente: "Acme Corporation Brasil",
    tituloReferencia: "REC-1004",
    valor: 3200.00,
    vencimento: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    canal: ["WhatsApp"],
    dataHoraEnvio: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 7200000).toISOString(),
    dataHoraPagamento: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    statusCobranca: "Paga",
    statusEntrega: "Entregue",
    statusLeitura: "Lida",
    responsavel: "Sistema Automatizado",
    mensagemPersonalizada: "Olá Acme! Notamos que o título REC-1004 ainda está em aberto. Segue chave PIX para liquidação imediata.",
    pixCopiaECola: "00020126580014br.gov.bcb.pix0136456e7890-e89b-12d3-a456-42661417400052040000530398654053200.005802BR5913FOCUS ERP6009SAO PAULO62070503***6304BC89",
    respostaCliente: "Pagamento realizado com sucesso via PIX. Comprovante anexado!",
    classificacaoResposta: "Confirmação de pagamento",
    timeline: [
      {
        id: "t-301",
        dataHora: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        usuario: "Sistema Focus",
        canal: "WhatsApp",
        acao: "Cobrança Disparada",
        detalhes: "Notificação de vencimento enviada."
      },
      {
        id: "t-302",
        dataHora: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 3600000).toISOString(),
        usuario: "Cliente (Acme Corp)",
        canal: "WhatsApp",
        acao: "PIX Copiado",
        detalhes: "Cliente copiou a chave PIX e confirmou pagamento."
      },
      {
        id: "t-303",
        dataHora: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        usuario: "Conciliação Bancária Focus",
        canal: "WhatsApp",
        acao: "Pagamento Confirmado",
        detalhes: "Recebimento de R$ 3.200,00 reconciliado com sucesso."
      }
    ]
  },
  {
    id: "COB-1004",
    cliente: "Vanguard Retail & Logística",
    tituloReferencia: "REC-1040",
    valor: 8900.00,
    vencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    canal: ["E-mail", "WhatsApp"],
    statusCobranca: "Agendada",
    statusEntrega: "Pendente",
    statusLeitura: "Não lida",
    responsavel: "Robô de Régua de Cobrança",
    agendamento: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    mensagemPersonalizada: "Olá Vanguard Retail, sua fatura de R$ 8.900,00 vence em 3 dias. Antecipe o pagamento e ganhe 3% de desconto.",
    timeline: [
      {
        id: "t-401",
        dataHora: new Date().toISOString(),
        usuario: "Régua Inteligente",
        acao: "Cobrança Agendada",
        detalhes: "Agendada para envio automático amanhã às 08:30."
      }
    ]
  },
  {
    id: "COB-1005",
    cliente: "Nexus Digital Studio",
    tituloReferencia: "REC-1052",
    valor: 1850.00,
    vencimento: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    canal: ["WhatsApp", "SMS"],
    dataHoraEnvio: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    statusCobranca: "Respondida",
    statusEntrega: "Entregue",
    statusLeitura: "Lida",
    responsavel: "Adriano Leal",
    mensagemPersonalizada: "Olá Nexus Digital! Identificamos que o título REC-1052 está pendente há 10 dias. Por favor, regularize para evitar interrupção dos serviços.",
    pixCopiaECola: "00020126580014br.gov.bcb.pix0136789e1234-e89b-12d3-a456-42661417400052040000530398654051850.005802BR5913FOCUS ERP6009SAO PAULO62070503***6304F34E",
    linhaDigitavel: "03399.01234 56789.012345 67890.123456 2 98700000185000",
    respostaCliente: "Olá Adriano! Poderia emitir uma 2ª via do boleto atualizado para sexta-feira?",
    classificacaoResposta: "Solicitação de boleto",
    timeline: [
      {
        id: "t-501",
        dataHora: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        usuario: "Adriano Leal",
        canal: "WhatsApp",
        acao: "Cobrança Manual Enviada",
        detalhes: "Notificação com PIX e Boleto enviada ao diretor de operações."
      },
      {
        id: "t-502",
        dataHora: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        usuario: "Cliente (Nexus)",
        canal: "WhatsApp",
        acao: "Resposta Recebida",
        detalhes: "Cliente solicitou 2ª via com novo vencimento para sexta-feira."
      }
    ]
  }
];

export const mockCobrancas: Cobranca[] = INITIAL_COBRANCAS;
