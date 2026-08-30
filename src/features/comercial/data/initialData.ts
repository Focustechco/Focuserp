import { 
  MembroEquipeComercial, MetaComercial, OkrComercial, RegraComissao, RegistroComissao,
  ProdutoComercial, ServicoComercial, TabelaPreco, PropostaComercial,
  ScriptVenda, EstrategiaComercial, PlaybookComercial, AtividadeComercial, AgendaComercialItem
} from "../types";

export const INITIAL_EQUIPE: MembroEquipeComercial[] = [
  {
    id: "eq-1",
    nome: "Adriano Leal",
    email: "adriano@focustech.com.br",
    funcao: "Executivo de Contas",
    supervisor: "Diretoria Comercial",
    metaMensalR$: 150000,
    metaContratos: 4,
    comissaoPercentual: 8,
    resultadoRealizadoR$: 0,
    status: "Ativo"
  },
  {
    id: "eq-2",
    nome: "Mariana Oliveira",
    email: "mariana.oliveira@focustech.com.br",
    funcao: "Closer",
    supervisor: "Adriano Leal",
    metaMensalR$: 120000,
    metaContratos: 3,
    comissaoPercentual: 7,
    resultadoRealizadoR$: 0,
    status: "Ativo"
  },
  {
    id: "eq-3",
    nome: "Marcelo Santos",
    email: "marcelo.santos@focustech.com.br",
    funcao: "SDR",
    supervisor: "Adriano Leal",
    metaMensalR$: 80000,
    metaContratos: 10,
    comissaoPercentual: 4,
    resultadoRealizadoR$: 0,
    status: "Ativo"
  }
];

export const INITIAL_METAS: MetaComercial[] = [
  {
    id: "meta-1",
    titulo: "Receita Comercial Q1 2026",
    tipo: "Trimestral",
    aplicadaA: "Equipe Geral",
    categoriaTarget: "Receita Total",
    valorMeta: 500000,
    valorRealizado: 0,
    periodo: "Q1 2026",
    status: "Em Andamento"
  },
  {
    id: "meta-2",
    titulo: "Novos Contratos SaaS Enterprise",
    tipo: "Mensal",
    aplicadaA: "Equipe Geral",
    categoriaTarget: "Contratos Recorrentes",
    valorMeta: 10,
    valorRealizado: 0,
    periodo: "Março 2026",
    status: "Em Andamento"
  },
  {
    id: "meta-3",
    titulo: "Diagnósticos Comerciais Agendados",
    tipo: "Mensal",
    aplicadaA: "Marcelo Santos",
    categoriaTarget: "Contatos / Follow-ups",
    valorMeta: 35,
    valorRealizado: 0,
    periodo: "Março 2026",
    status: "Em Andamento"
  }
];

export const INITIAL_OKRS: OkrComercial[] = [
  {
    id: "okr-1",
    objetivo: "Aumentar a Eficiência do Funil Comercial",
    keyResult: "Alcançar taxa de conversão de 25% de Diagnósticos para Propostas",
    responsavel: "Adriano Leal",
    periodo: "Q1 2026",
    percentualConclusao: 65,
    status: "No Prazo"
  },
  {
    id: "okr-2",
    objetivo: "Reduzir o Ciclo Médio de Fechamento",
    keyResult: "Reduzir o tempo de fechamento de 45 para 28 dias",
    responsavel: "Mariana Oliveira",
    periodo: "Q1 2026",
    percentualConclusao: 40,
    status: "Atenção"
  },
  {
    id: "okr-3",
    objetivo: "Expansão de Contas Enterprise B2B",
    keyResult: "Gerar 15 novos leads qualificados com faturamento acima de R$ 10M",
    responsavel: "Marcelo Santos",
    periodo: "Q1 2026",
    percentualConclusao: 80,
    status: "No Prazo"
  }
];

export const INITIAL_REGRAS_COMISSAO: RegraComissao[] = [
  {
    id: "reg-1",
    titulo: "Comissão Closer Enterprise (8%)",
    funcaoOuConsultor: "Executivo de Contas / Closer",
    tipo: "Percentual",
    aliquotaPercentual: 8,
    criterioLiberacao: "Na Assinatura",
    status: "Ativa"
  },
  {
    id: "reg-2",
    titulo: "Comissão SDR por Diagnóstico Qualificado",
    funcaoOuConsultor: "SDR",
    tipo: "Valor Fixo",
    aliquotaPercentual: 0,
    valorFixoR$: 250,
    criterioLiberacao: "No Pagamento da 1ª Parcela",
    status: "Ativa"
  },
  {
    id: "reg-3",
    titulo: "Bônus por Superação de Meta Mensal (+3%)",
    funcaoOuConsultor: "Equipe Geral",
    tipo: "Escalonado",
    aliquotaPercentual: 3,
    criterioLiberacao: "Na Assinatura",
    status: "Ativa"
  }
];

export const INITIAL_REGISTROS_COMISSAO: RegistroComissao[] = [];

export const INITIAL_PRODUTOS: ProdutoComercial[] = [
  {
    id: "prd-1",
    codigo: "PRD-ERP-ENT",
    nome: "Focus ERP Enterprise — Suite Completa",
    categoria: "ERP",
    descricao: "ERP completo com Financeiro, DRE, Conciliação Bancária, Contratos, RH e Cobranças Multicanal.",
    precoBaseR$: 4500,
    precoMinimoR$: 3200,
    precoSugeridoR$: 5900,
    tipoCobranca: "Mensal Recorrente (SaaS)",
    status: "Ativo"
  },
  {
    id: "prd-2",
    codigo: "PRD-CRM-OPS",
    nome: "Focus CRM & Commercial Ops Hub",
    categoria: "CRM",
    descricao: "Pipeline visual integrado com ClickUp em tempo real, gestão de propostas, scripts e metas.",
    precoBaseR$: 1800,
    precoMinimoR$: 1200,
    precoSugeridoR$: 2500,
    tipoCobranca: "Mensal Recorrente (SaaS)",
    status: "Ativo"
  },
  {
    id: "prd-3",
    codigo: "PRD-COB-AUTO",
    nome: "Focus Cobrança Pro — Régua Multicanal",
    categoria: "Automação",
    descricao: "Disparos automatizados via WhatsApp Oficial, E-mail e SMS com geração de PIX Copia e Cola e Boleto.",
    precoBaseR$: 1200,
    precoMinimoR$: 800,
    precoSugeridoR$: 1600,
    tipoCobranca: "Mensal Recorrente (SaaS)",
    status: "Ativo"
  }
];

export const INITIAL_SERVICOS: ServicoComercial[] = [
  {
    id: "srv-1",
    codigo: "SRV-IMP-SETUP",
    nome: "Setup & Implantação Assistida Focus ERP",
    categoria: "Implantação",
    descricao: "Parametrização contábil, plano de contas, centros de custo, integração bancária e migração de dados.",
    precoR$: 8500,
    tempoMedio: "30 dias",
    status: "Ativo"
  },
  {
    id: "srv-2",
    codigo: "SRV-TRN-EXEC",
    nome: "Capacitação & Treinamento de Equipes",
    categoria: "Treinamento",
    descricao: "Workshops ao vivo gravados com manual operacional personalizado para toda a diretoria e equipe.",
    precoR$: 3500,
    tempoMedio: "15 horas",
    status: "Ativo"
  }
];

export const INITIAL_TABELAS: TabelaPreco[] = [
  {
    id: "tab-1",
    nome: "Tabela Padrão Enterprise 2026",
    descontoPadraoPercentual: 0,
    acrescimoPadraoPercentual: 0,
    validade: "2026-12-31",
    status: "Ativa"
  },
  {
    id: "tab-2",
    nome: "Tabela Parcerias & Franquias",
    descontoPadraoPercentual: 15,
    acrescimoPadraoPercentual: 0,
    validade: "2026-12-31",
    status: "Ativa"
  }
];

export const INITIAL_PROPOSTAS: PropostaComercial[] = [];

export const INITIAL_SCRIPTS: ScriptVenda[] = [
  {
    id: "sc-1",
    titulo: "Abordagem Inicial WhatsApp — Decisor B2B",
    categoria: "WhatsApp",
    objetivo: "Despertar curiosidade sobre gargalos de gestão financeira e agendar diagnóstico de 15 minutos.",
    conteudo: `Olá, [Nome do Decisor]! Tudo bem?

Aqui é o [Seu Nome], da Focus Tech. Acompanho a atuação da [Nome da Empresa] e notei que vocês estão em forte momento de expansão.

Geralmente, empresas do seu porte perdem até 4 horas por dia conciliando bancos manualmente e cobrando inadimplentes no braço.

Nós automatizamos 100% desse fluxo no Focus ERP com emissão de PIX e integração bancária direta.

Você teria 15 minutos nesta quinta-feira às 15h para vermos se faz sentido para a sua operação?`,
    tags: ["WhatsApp", "Primeiro Contato", "B2B"],
    autor: "Adriano Leal",
    dataAtualizacao: "2026-02-28",
    favorito: true
  },
  {
    id: "sc-2",
    titulo: "Contorno de Objeção: 'Já usamos outro sistema'",
    categoria: "Contorno de Objeções",
    objetivo: "Mostrar o diferencial de conciliação bancária automática e BI em tempo real sem bater de frente.",
    conteudo: `Compreendo perfeitamente, [Nome]! A maioria dos nossos clientes atuais já utilizava soluções tradicionais como Totvs ou Omie antes de migrar.

O que eles mais valorizaram na Focus não foi trocar de sistema por trocar, mas sim eliminar as planilhas paralelas que o sistema atual não resolve — como régua de cobrança multicanal no WhatsApp e centros de custo interligados ao DRE em tempo real.

Como está hoje a velocidade com que a sua diretoria recebe o fluxo de caixa consolidado?`,
    tags: ["Objeções", "Concorrência", "ERP"],
    autor: "Mariana Oliveira",
    dataAtualizacao: "2026-02-25",
    favorito: true
  },
  {
    id: "sc-3",
    titulo: "Pitch de Fechamento: Diagnóstico → Assinatura",
    categoria: "Fechamento",
    objetivo: "Apresentar a proposta com foco em ROI e redução de inadimplência.",
    conteudo: `[Nome], com base no diagnóstico que realizamos, vimos que a [Empresa] recuperará em média R$ [Valor] por mês apenas automatizando a régua de cobrança e eliminando retrabalho no Contas a Pagar.

O investimento no Focus ERP é de apenas R$ [Valor Mensal], ou seja, o sistema se paga já nos primeiros 15 dias de operação.

Se validarmos a minuta hoje, nossa equipe de engenharia já inicia o setup na próxima segunda-feira. Podemos avançar com o contrato?`,
    tags: ["Fechamento", "Pitch", "ROI"],
    autor: "Adriano Leal",
    dataAtualizacao: "2026-02-20",
    favorito: true
  },
  {
    id: "sc-4",
    titulo: "Follow-up de Proposta Enviada (Aguardando Retorno)",
    categoria: "Follow-up",
    objetivo: "Reengajar decisor que recebeu a proposta sem parecer insistente.",
    conteudo: `Olá [Nome], tudo bem?

Passando para checar se você conseguiu analisar a minuta da proposta do Focus ERP que enviamos no início da semana.

Ficou alguma dúvida técnica ou referente às condições comerciais que eu possa esclarecer para facilitar a sua decisão com os sócios?`,
    tags: ["Follow-up", "Proposta", "Reengajamento"],
    autor: "Mariana Oliveira",
    dataAtualizacao: "2026-02-18",
    favorito: false
  }
];

export const INITIAL_ESTRATEGIAS: EstrategiaComercial[] = [
  {
    id: "est-1",
    titulo: "Playbook Outbound Enterprise (BDR + Closer)",
    categoria: "Prospecção Outbound",
    objetivo: "Captação ativa de médias e grandes empresas através de abordagem multicanal coordenada.",
    publicoAlvo: "CFOs, Diretores Financeiros e Gerentes de TI de empresas com faturamento acima de R$ 5M/ano.",
    quandoUtilizar: "Para prospecção fria de contas estratégicas identificadas no LinkedIn e Receita Federal.",
    etapas: [
      "Mapeamento de Contas e Decisores (LinkedIn Sales Navigator)",
      "Conexão e Envio de Mensagem Personalizada de Alto Valor",
      "Ligação Telefônica de Qualificação rápida (3 minutos)",
      "Agendamento de Diagnóstico Técnico de 30 minutos com Closer",
      "Apresentação da Proposta Customizada em até 48 horas"
    ],
    checklist: [
      { item: "Validar CNPJ e regime tributário da empresa antes do contato", concluido: true },
      { item: "Identificar o decisor final (CFO/Sócio)", concluido: true },
      { item: "Registrar atividade no CRM com data do próximo follow-up", concluido: false },
      { item: "Enviar resumo da reunião por WhatsApp logo após o call", concluido: false }
    ],
    responsavel: "Adriano Leal"
  },
  {
    id: "est-2",
    titulo: "Régua de Follow-up de 5 Toques em 10 Dias",
    categoria: "Follow-up de Alto Impacto",
    objetivo: "Garantir taxa de resposta superior a 60% em leads que esfriaram após o primeiro contato.",
    publicoAlvo: "Leads que solicitaram contato ou realizaram diagnóstico mas não responderam a proposta.",
    quandoUtilizar: "Logo após o envio da proposta comercial.",
    etapas: [
      "Dia 1: Envio da Proposta + Mensagem de confirmação no WhatsApp",
      "Dia 3: Áudio curto no WhatsApp destacando o ponto crítico levantado no diagnóstico",
      "Dia 5: Ligação telefônica rápida de alinhamento",
      "Dia 7: Envio de Estudo de Caso / Prova Social de cliente do mesmo segmento",
      "Dia 10: E-mail de 'Break-up' cordial liberando o lead"
    ],
    checklist: [
      { item: "Nunca mandar apenas 'alguma novidade?'", concluido: true },
      { item: "Sempre agregar valor a cada toque (dado, case ou insight)", concluido: true },
      { item: "Alternar entre canais (WhatsApp, Telefone, E-mail)", concluido: false }
    ],
    responsavel: "Mariana Oliveira"
  }
];

export const INITIAL_PLAYBOOKS: PlaybookComercial[] = [
  {
    id: "pb-1",
    titulo: "Playbook Oficial do SDR & Prospecção",
    funcaoAlvo: "SDR",
    descricao: "Guia passo a passo para qualificação de leads, abordagem inicial, contorno de porteiros e agendamento de reuniões qualificadas.",
    etapasDoProcesso: [
      {
        titulo: "1. Pesquisa & Enriquecimento de Dados",
        instrucoes: "Antes de ligar, verifique o segmento, número de funcionários e ferramentas que a empresa utiliza.",
        ferramentasRecomendadas: ["LinkedIn", "Consulta CNPJ", "ClickUp CRM"]
      },
      {
        titulo: "2. Script de Abertura em 30 Segundos",
        instrucoes: "Capture a atenção nos primeiros 10 segundos falando sobre o problema, não sobre o produto.",
        ferramentasRecomendadas: ["Telefonia VoIP", "Scripts de Venda"]
      },
      {
        titulo: "3. Qualificação BANT (Budget, Authority, Need, Timing)",
        instrucoes: "Confirme se o contato possui autoridade de decisão e urgência para resolver o problema.",
        ferramentasRecomendadas: ["Formulário de Diagnóstico"]
      }
    ],
    checklists: [
      "Confirmar e-mail e WhatsApp direto do decisor",
      "Registrar a gravação ou resumo da ligação no Comercial Ops",
      "Enviar convite de calendário com link da sala de reunião"
    ]
  },
  {
    id: "pb-2",
    titulo: "Playbook do Closer & Executivo de Vendas",
    funcaoAlvo: "Closer",
    descricao: "Metodologia para condução de reuniões de diagnóstico, demonstração focada em dor, precificação e fechamento de contratos.",
    etapasDoProcesso: [
      {
        titulo: "1. Condução do Diagnóstico (Spin Selling)",
        instrucoes: "Investigue a Situação, Problema, Implicação e Necessidade de Solução antes de abrir o sistema.",
        ferramentasRecomendadas: ["Framework SPIN", "Focus ERP Demo"]
      },
      {
        titulo: "2. Demonstração Personalizada",
        instrucoes: "Mostre apenas as 3 telas que resolvem a dor prioritária identificada no diagnóstico.",
        ferramentasRecomendadas: ["Ambiente de Demonstração"]
      },
      {
        titulo: "3. Negociação de Minuta e Assinatura",
        instrucoes: "Apresente o contrato já preenchido e utilize ancoragem de preço.",
        ferramentasRecomendadas: ["Módulo de Propostas", "DMS & Assinaturas"]
      }
    ],
    checklists: [
      "Calcular o ROI anual estimado durante a reunião",
      "Definir a data e hora exata da reunião de validação da proposta",
      "Acionar automação de criação de Cliente e Contrato ao marcar como Ganho"
    ]
  }
];

export const INITIAL_ATIVIDADES_COMERCIAIS: AtividadeComercial[] = [];

export const INITIAL_AGENDA_COMERCIAL: AgendaComercialItem[] = [
  {
    id: "ag-1",
    tipo: "Reunião Hoje",
    titulo: "Apresentação de Proposta Focus ERP",
    cliente: "Grupo Logística Sul S.A.",
    contato: "Roberto Fonseca (CFO)",
    horario: "14:30",
    data: new Date().toISOString().split('T')[0],
    responsavel: "Adriano Leal",
    status: "Pendente",
    prioridade: "Urgente"
  },
  {
    id: "ag-2",
    tipo: "Follow-up Atrasado",
    titulo: "Checar assinatura do contrato",
    cliente: "Transmite Libras",
    contato: "Diretoria",
    horario: "11:00",
    data: new Date().toISOString().split('T')[0],
    responsavel: "Mariana Oliveira",
    status: "Pendente",
    prioridade: "Alta"
  },
  {
    id: "ag-3",
    tipo: "Lead para Contatar",
    titulo: "Primeiro contato lead inbound",
    cliente: "Clínica Saúde & Vida",
    contato: "Dra. Heloísa",
    horario: "16:00",
    data: new Date().toISOString().split('T')[0],
    responsavel: "Marcelo Santos",
    status: "Pendente",
    prioridade: "Alta"
  }
];
