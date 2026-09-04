import { useLocalStorageState } from '@/hooks/useDataStore';
import {
  Equipamento,
  EstoqueItem,
  Licenca,
  Patrimonio,
  Movimentacao,
  Inventario,
  Manutencao,
  EquipamentoTimelineEvent,
} from '../types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { TituloReceber } from '@/features/contas-receber/types';
import { contaPagarService } from '@/services/contaPagarService';
import { contaReceberService } from '@/services/contaReceberService';

const INITIAL_EQUIPAMENTOS: Equipamento[] = [
  {
    id: 'eq-focus-001',
    codigoPatrimonial: 'PAT-EQ-001',
    categoria: 'Notebook',
    marca: 'Dell',
    modelo: 'Latitude 3520 15.6"',
    numeroSerie: 'BR-DELL-89421',
    dataAquisicao: '2024-01-15',
    valorCompra: 5290.0,
    garantiaMeses: 24,
    situacao: 'Em Uso',
    departamento: 'Desenvolvimento & Tecnologia',
    colaboradorNome: 'Carlos Eduardo Souza',
    localFisica: 'Estação Dev - 01',
    observacoes: 'Notebook corporativo para desenvolvimento full stack',
    notebookSpecs: {
      processador: 'Intel Core i7 11ª Geração',
      memoriaRam: '16GB DDR4 3200MHz',
      armazenamento: '512GB SSD NVMe M.2',
      sistemaOperacional: 'Windows 11 Pro',
      fabricante: 'Dell Computadores',
    },
    timeline: [
      {
        id: 'tm-eq-001',
        dataHora: '15/01/2024 10:30',
        tipo: 'Aquisição',
        descricao: 'Equipamento adquirido e configurado no domínio corporativo',
        responsavel: 'Carlos Eduardo Souza',
        usuarioRegistro: 'Administrador',
      },
    ],
  },
  {
    id: 'eq-focus-002',
    codigoPatrimonial: 'PAT-EQ-002',
    categoria: 'Notebook',
    marca: 'Apple',
    modelo: 'MacBook Pro 14" M2 Pro',
    numeroSerie: 'C02G879XP0',
    dataAquisicao: '2024-02-10',
    valorCompra: 13999.0,
    garantiaMeses: 12,
    situacao: 'Em Uso',
    departamento: 'Engenharia de Software',
    colaboradorNome: 'Ana Paula Silva',
    localFisica: 'Estação Tech Lead - 02',
    observacoes: 'Estação principal de liderança técnica e arquitetura de microsserviços',
    notebookSpecs: {
      processador: 'Apple Silicon M2 Pro (10-core)',
      memoriaRam: '16GB Unificada',
      armazenamento: '512GB SSD Ultra-Fast',
      sistemaOperacional: 'macOS Sonoma',
      fabricante: 'Apple Inc.',
    },
    timeline: [
      {
        id: 'tm-eq-002',
        dataHora: '10/02/2024 14:00',
        tipo: 'Aquisição',
        descricao: 'Entrega do equipamento para liderança técnica com assinatura de termo',
        responsavel: 'Ana Paula Silva',
        usuarioRegistro: 'Administrador',
      },
    ],
  },
  {
    id: 'eq-focus-003',
    codigoPatrimonial: 'PAT-EQ-003',
    categoria: 'Notebook',
    marca: 'Lenovo',
    modelo: 'ThinkPad E14 Gen 4',
    numeroSerie: 'PF-39829A',
    dataAquisicao: '2024-03-05',
    valorCompra: 4890.0,
    garantiaMeses: 36,
    situacao: 'Em Uso',
    departamento: 'Design & Produto',
    colaboradorNome: 'Gabriel Souza',
    localFisica: 'Estação Produto - 03',
    observacoes: 'Notebook para prototipagem UI/UX e gestão de backlog',
    notebookSpecs: {
      processador: 'AMD Ryzen 7 5700U',
      memoriaRam: '16GB DDR4',
      armazenamento: '512GB SSD NVMe',
      sistemaOperacional: 'Windows 11 Pro',
      fabricante: 'Lenovo',
    },
    timeline: [
      {
        id: 'tm-eq-003',
        dataHora: '05/03/2024 11:15',
        tipo: 'Aquisição',
        descricao: 'Alocação para equipe de produto',
        responsavel: 'Gabriel Souza',
        usuarioRegistro: 'Administrador',
      },
    ],
  },
  {
    id: 'eq-focus-004',
    codigoPatrimonial: 'PAT-EQ-004',
    categoria: 'Monitor',
    marca: 'Dell',
    modelo: 'UltraSharp 27" 4K U2723QE',
    numeroSerie: 'CN-0M9Y87',
    dataAquisicao: '2024-01-20',
    valorCompra: 3450.0,
    garantiaMeses: 36,
    situacao: 'Em Uso',
    departamento: 'Diretoria Executiva',
    colaboradorNome: 'Roberto Almeida',
    localFisica: 'Gabinete Diretoria',
    observacoes: 'Monitor 4K IPS Black com Hub USB-C 90W integrado',
    monitorSpecs: {
      polegadas: '27"',
      resolucao: '3840 x 2160 (4K UHD)',
      tipoPainel: 'IPS Black Anti-Reflexo',
      conexoes: ['HDMI 2.0', 'DisplayPort 1.4', 'USB-C com PD 90W', 'RJ-45 Ethernet'],
    },
    timeline: [
      {
        id: 'tm-eq-004',
        dataHora: '20/01/2024 09:00',
        tipo: 'Aquisição',
        descricao: 'Instalação em suporte ergonômico no gabinete da diretoria',
        responsavel: 'Roberto Almeida',
        usuarioRegistro: 'Administrador',
      },
    ],
  },
  {
    id: 'eq-focus-005',
    codigoPatrimonial: 'PAT-EQ-005',
    categoria: 'Monitor',
    marca: 'LG',
    modelo: 'UltraWide 29" 29WL500',
    numeroSerie: 'LG-29WL-09124',
    dataAquisicao: '2024-02-15',
    valorCompra: 1290.0,
    garantiaMeses: 12,
    situacao: 'Em Uso',
    departamento: 'Desenvolvimento & Tecnologia',
    colaboradorNome: 'Mariana Santos',
    localFisica: 'Estação Dev - 04',
    observacoes: 'Monitor UltraWide 21:9 para visualização de IDE e terminal',
    monitorSpecs: {
      polegadas: '29"',
      resolucao: '2560 x 1080 (WFHD)',
      tipoPainel: 'IPS sRGB 99%',
      conexoes: ['2x HDMI', 'Saída de Fone de Ouvido'],
    },
    timeline: [
      {
        id: 'tm-eq-005',
        dataHora: '15/02/2024 16:30',
        tipo: 'Aquisição',
        descricao: 'Entregue à colaboradora Mariana Santos',
        responsavel: 'Mariana Santos',
        usuarioRegistro: 'Administrador',
      },
    ],
  },
  {
    id: 'eq-focus-006',
    codigoPatrimonial: 'PAT-EQ-006',
    categoria: 'Servidor',
    marca: 'Dell',
    modelo: 'PowerEdge R450 Rack 1U',
    numeroSerie: 'SRV-R450-9921',
    dataAquisicao: '2023-11-10',
    valorCompra: 24500.0,
    garantiaMeses: 36,
    situacao: 'Em Uso',
    departamento: 'Infraestrutura & Redes',
    colaboradorNome: 'Equipe de Infraestrutura',
    localFisica: 'Data Center Rack 01 - U12',
    observacoes: 'Servidor de virtualização local, VPN corporativa e backups on-premise',
    timeline: [
      {
        id: 'tm-eq-006',
        dataHora: '10/11/2023 18:00',
        tipo: 'Aquisição',
        descricao: 'Ativação do servidor em cluster de alta disponibilidade',
        responsavel: 'Infraestrutura TI',
        usuarioRegistro: 'Administrador',
      },
    ],
  },
  {
    id: 'eq-focus-007',
    codigoPatrimonial: 'PAT-EQ-007',
    categoria: 'Switch',
    marca: 'Cisco',
    modelo: 'Catalyst SG350-28P Gigabit PoE+',
    numeroSerie: 'FOC-SW-350P',
    dataAquisicao: '2023-11-10',
    valorCompra: 4200.0,
    garantiaMeses: 60,
    situacao: 'Em Uso',
    departamento: 'Infraestrutura & Redes',
    colaboradorNome: 'Equipe de Infraestrutura',
    localFisica: 'Data Center Rack 01 - U08',
    observacoes: 'Switch central de distribuição com VLANs corporativas e Wi-Fi PoE',
    timeline: [
      {
        id: 'tm-eq-007',
        dataHora: '10/11/2023 18:30',
        tipo: 'Aquisição',
        descricao: 'Configuração das VLANs 10 (Corp), 20 (Dev) e 30 (Guest)',
        responsavel: 'Infraestrutura TI',
        usuarioRegistro: 'Administrador',
      },
    ],
  },
  {
    id: 'eq-focus-008',
    codigoPatrimonial: 'PAT-EQ-008',
    categoria: 'Nobreak',
    marca: 'APC by Schneider',
    modelo: 'Smart-UPS 3000VA Senoidal Bivolt',
    numeroSerie: 'APC-SU3000-771',
    dataAquisicao: '2023-11-12',
    valorCompra: 6800.0,
    garantiaMeses: 24,
    situacao: 'Em Uso',
    departamento: 'Infraestrutura & Redes',
    colaboradorNome: 'Equipe de Infraestrutura',
    localFisica: 'Data Center Rack 01 - U01',
    observacoes: 'Proteção elétrica e redundância do Data Center com autonomia de 45 min',
    timeline: [
      {
        id: 'tm-eq-008',
        dataHora: '12/11/2023 10:00',
        tipo: 'Aquisição',
        descricao: 'Instalação e calibração do banco de baterias',
        responsavel: 'Infraestrutura TI',
        usuarioRegistro: 'Administrador',
      },
    ],
  },
];

const INITIAL_PATRIMONIOS: Patrimonio[] = [
  {
    id: 'pat-focus-001',
    numeroPatrimonial: 'PAT-EQ-001',
    codigoInterno: 'AST-EQ001',
    categoria: 'Notebook',
    valorCompra: 5290.0,
    valorAtual: 4232.0,
    vidaUtilAnos: 4,
    depreciacaoAcumulada: 1058.0,
    estadoConservacao: 'Excelente',
    situacao: 'Ativo',
    centroCustoNome: 'Tecnologia da Informação',
    localizacao: 'Estação Dev - 01',
    responsavel: 'Carlos Eduardo Souza',
    dataAquisicao: '2024-01-15',
    fornecedor: 'Dell Computadores do Brasil Ltda',
  },
  {
    id: 'pat-focus-002',
    numeroPatrimonial: 'PAT-EQ-002',
    codigoInterno: 'AST-EQ002',
    categoria: 'Notebook',
    valorCompra: 13999.0,
    valorAtual: 11899.0,
    vidaUtilAnos: 4,
    depreciacaoAcumulada: 2100.0,
    estadoConservacao: 'Excelente',
    situacao: 'Ativo',
    centroCustoNome: 'Engenharia de Software',
    localizacao: 'Estação Tech Lead - 02',
    responsavel: 'Ana Paula Silva',
    dataAquisicao: '2024-02-10',
    fornecedor: 'Apple Computer Brasil Ltda',
  },
  {
    id: 'pat-focus-003',
    numeroPatrimonial: 'PAT-EQ-003',
    codigoInterno: 'AST-EQ003',
    categoria: 'Notebook',
    valorCompra: 4890.0,
    valorAtual: 4156.0,
    vidaUtilAnos: 4,
    depreciacaoAcumulada: 734.0,
    estadoConservacao: 'Bom',
    situacao: 'Ativo',
    centroCustoNome: 'Produto & Design',
    localizacao: 'Estação Produto - 03',
    responsavel: 'Gabriel Souza',
    dataAquisicao: '2024-03-05',
    fornecedor: 'Lenovo Tecnologia Brasil Ltda',
  },
  {
    id: 'pat-focus-004',
    numeroPatrimonial: 'PAT-EQ-004',
    codigoInterno: 'AST-EQ004',
    categoria: 'Monitor',
    valorCompra: 3450.0,
    valorAtual: 2760.0,
    vidaUtilAnos: 5,
    depreciacaoAcumulada: 690.0,
    estadoConservacao: 'Excelente',
    situacao: 'Ativo',
    centroCustoNome: 'Diretoria Executiva',
    localizacao: 'Gabinete Diretoria',
    responsavel: 'Roberto Almeida',
    dataAquisicao: '2024-01-20',
    fornecedor: 'Dell Computadores do Brasil Ltda',
  },
  {
    id: 'pat-focus-005',
    numeroPatrimonial: 'PAT-EQ-005',
    codigoInterno: 'AST-EQ005',
    categoria: 'Monitor',
    valorCompra: 1290.0,
    valorAtual: 1032.0,
    vidaUtilAnos: 5,
    depreciacaoAcumulada: 258.0,
    estadoConservacao: 'Bom',
    situacao: 'Ativo',
    centroCustoNome: 'Tecnologia da Informação',
    localizacao: 'Estação Dev - 04',
    responsavel: 'Mariana Santos',
    dataAquisicao: '2024-02-15',
    fornecedor: 'LG Electronics do Brasil',
  },
  {
    id: 'pat-focus-006',
    numeroPatrimonial: 'PAT-EQ-006',
    codigoInterno: 'AST-SRV001',
    categoria: 'Servidor',
    valorCompra: 24500.0,
    valorAtual: 19600.0,
    vidaUtilAnos: 5,
    depreciacaoAcumulada: 4900.0,
    estadoConservacao: 'Excelente',
    situacao: 'Ativo',
    centroCustoNome: 'Infraestrutura & Redes',
    localizacao: 'Data Center Rack 01 - U12',
    responsavel: 'Equipe de Infraestrutura',
    dataAquisicao: '2023-11-10',
    fornecedor: 'Dell Computadores do Brasil Ltda',
  },
  {
    id: 'pat-focus-007',
    numeroPatrimonial: 'PAT-EQ-007',
    codigoInterno: 'AST-SW001',
    categoria: 'Switch',
    valorCompra: 4200.0,
    valorAtual: 3360.0,
    vidaUtilAnos: 5,
    depreciacaoAcumulada: 840.0,
    estadoConservacao: 'Excelente',
    situacao: 'Ativo',
    centroCustoNome: 'Infraestrutura & Redes',
    localizacao: 'Data Center Rack 01 - U08',
    responsavel: 'Equipe de Infraestrutura',
    dataAquisicao: '2023-11-10',
    fornecedor: 'Cisco Systems Brasil Ltda',
  },
  {
    id: 'pat-focus-008',
    numeroPatrimonial: 'PAT-EQ-008',
    codigoInterno: 'AST-UPS001',
    categoria: 'Nobreak',
    valorCompra: 6800.0,
    valorAtual: 5440.0,
    vidaUtilAnos: 5,
    depreciacaoAcumulada: 1360.0,
    estadoConservacao: 'Bom',
    situacao: 'Ativo',
    centroCustoNome: 'Infraestrutura & Redes',
    localizacao: 'Data Center Rack 01 - U01',
    responsavel: 'Equipe de Infraestrutura',
    dataAquisicao: '2023-11-12',
    fornecedor: 'Schneider Electric Brasil',
  },
  {
    id: 'pat-focus-009',
    numeroPatrimonial: 'PAT-MOB-001',
    codigoInterno: 'AST-MOB001',
    categoria: 'Mobiliário & Escritório',
    valorCompra: 8900.0,
    valorAtual: 7565.0,
    vidaUtilAnos: 10,
    depreciacaoAcumulada: 1335.0,
    estadoConservacao: 'Excelente',
    situacao: 'Ativo',
    centroCustoNome: 'Administração & Predial',
    localizacao: 'Sala de Reunião Principal',
    responsavel: 'Administração Predial',
    dataAquisicao: '2023-10-01',
    fornecedor: 'Cavaletti Cadeiras e Móveis',
  },
];

const INITIAL_LICENCAS: Licenca[] = [
  {
    id: 'lic-focus-001',
    nome: 'GitHub Enterprise Cloud',
    fabricante: 'GitHub / Microsoft',
    plano: 'Enterprise Organization',
    tipo: 'Assinatura',
    quantidadeTotal: 20,
    quantidadeUsada: 14,
    quantidadeDisponivel: 6,
    dataCompra: '2024-01-01',
    vencimento: '2026-12-31',
    valor: 420.0,
    responsavelNome: 'Ana Paula Silva',
    centroCustoNome: 'Engenharia de Software',
    observacoes: 'Controle de repositórios, CI/CD Actions e Advanced Security',
  },
  {
    id: 'lic-focus-002',
    nome: 'Microsoft 365 Business Premium',
    fabricante: 'Microsoft Corporation',
    plano: 'Business Premium Corporate',
    tipo: 'Assinatura',
    quantidadeTotal: 25,
    quantidadeUsada: 19,
    quantidadeDisponivel: 6,
    dataCompra: '2024-01-01',
    vencimento: '2026-12-31',
    valor: 110.0,
    responsavelNome: 'Administração TI',
    centroCustoNome: 'Tecnologia da Informação',
    observacoes: 'Pacote Office, Exchange Online, Teams, Intune e Defender for Business',
  },
  {
    id: 'lic-focus-003',
    nome: 'AWS Cloud Infrastructure Services',
    fabricante: 'Amazon Web Services Inc.',
    plano: 'Enterprise Dedicated Tier',
    tipo: 'Assinatura',
    quantidadeTotal: 1,
    quantidadeUsada: 1,
    quantidadeDisponivel: 0,
    dataCompra: '2023-06-01',
    vencimento: '2026-12-31',
    valor: 4850.0,
    responsavelNome: 'Equipe de Infraestrutura',
    centroCustoNome: 'Infraestrutura & Redes',
    observacoes: 'Clusters EKS, instâncias EC2, RDS PostgreSQL, S3 Buckets e CloudFront',
  },
  {
    id: 'lic-focus-004',
    nome: 'Figma Enterprise Organization',
    fabricante: 'Figma Inc.',
    plano: 'Enterprise Workspace',
    tipo: 'Assinatura',
    quantidadeTotal: 8,
    quantidadeUsada: 5,
    quantidadeDisponivel: 3,
    dataCompra: '2024-02-01',
    vencimento: '2026-12-31',
    valor: 260.0,
    responsavelNome: 'Gabriel Souza',
    centroCustoNome: 'Produto & Design',
    observacoes: 'Design System Focus UI, prototipagem de produtos e testes de usabilidade',
  },
  {
    id: 'lic-focus-005',
    nome: 'JetBrains All Products Pack',
    fabricante: 'JetBrains s.r.o.',
    plano: 'Commercial Annual Pack',
    tipo: 'Assinatura',
    quantidadeTotal: 10,
    quantidadeUsada: 8,
    quantidadeDisponivel: 2,
    dataCompra: '2024-01-15',
    vencimento: '2026-01-15',
    valor: 3100.0,
    responsavelNome: 'Carlos Eduardo Souza',
    centroCustoNome: 'Engenharia de Software',
    observacoes: 'Licenças para WebStorm, IntelliJ IDEA Ultimate e DataGrip',
  },
  {
    id: 'lic-focus-006',
    nome: 'Supabase Pro Platform',
    fabricante: 'Supabase Inc.',
    plano: 'Pro Tier Database',
    tipo: 'Assinatura',
    quantidadeTotal: 2,
    quantidadeUsada: 2,
    quantidadeDisponivel: 0,
    dataCompra: '2024-01-01',
    vencimento: '2026-12-31',
    valor: 160.0,
    responsavelNome: 'Equipe de Infraestrutura',
    centroCustoNome: 'Tecnologia da Informação',
    observacoes: 'Bancos PostgreSQL de produção, autenticação JWT e Realtime Engine',
  },
];

const INITIAL_MOVIMENTACOES: Movimentacao[] = [
  {
    id: 'mov-focus-001',
    tipo: 'Entrada',
    equipamentoId: 'eq-focus-001',
    equipamentoNome: 'Dell Latitude 3520 (PAT-EQ-001)',
    usuarioId: 'usr-admin',
    usuarioNome: 'Administrador TI',
    dataHora: '15/01/2024 10:30',
    origem: 'Aquisição Dell Brasil',
    destino: 'Estação Dev - 01',
    responsavelNome: 'Carlos Eduardo Souza',
    observacoes: 'Cadastrado e entregue com termo de responsabilidade assinado.',
  },
  {
    id: 'mov-focus-002',
    tipo: 'Entrada',
    equipamentoId: 'eq-focus-002',
    equipamentoNome: 'MacBook Pro 14" M2 Pro (PAT-EQ-002)',
    usuarioId: 'usr-admin',
    usuarioNome: 'Administrador TI',
    dataHora: '10/02/2024 14:00',
    origem: 'Aquisição Apple Brasil',
    destino: 'Estação Tech Lead - 02',
    responsavelNome: 'Ana Paula Silva',
    observacoes: 'Entregue à Tech Lead para gestão e desenvolvimento.',
  },
  {
    id: 'mov-focus-003',
    tipo: 'Transferência',
    equipamentoId: 'eq-focus-005',
    equipamentoNome: 'Monitor LG UltraWide 29" (PAT-EQ-005)',
    usuarioId: 'usr-admin',
    usuarioNome: 'Administrador TI',
    dataHora: '15/02/2024 16:30',
    origem: 'Estoque Central Almoxarifado',
    destino: 'Estação Dev - 04',
    responsavelNome: 'Mariana Santos',
    observacoes: 'Alocado monitor adicional para posto de trabalho de desenvolvimento.',
  },
  {
    id: 'mov-focus-004',
    tipo: 'Manutenção',
    equipamentoId: 'eq-focus-008',
    equipamentoNome: 'Nobreak APC Smart-UPS 3000VA (PAT-EQ-008)',
    usuarioId: 'usr-admin',
    usuarioNome: 'Administrador TI',
    dataHora: '02/08/2024 11:00',
    origem: 'Data Center Rack 01',
    destino: 'Manutenção Preventiva Especializada',
    responsavelNome: 'Equipe de Infraestrutura',
    observacoes: 'Preventiva semestral: teste de autonomia e balanceamento das baterias.',
  },
];

const INITIAL_INVENTARIOS: Inventario[] = [
  {
    id: 'inv-focus-001',
    codigo: 'INV-2026-01',
    titulo: 'Auditoria Patrimonial e ITAM Geral 2026',
    dataInicio: '2026-01-10',
    dataFim: '2026-01-15',
    status: 'Concluído',
    responsavel: 'Auditoria Interna & TI',
    totalItensEsperados: 15,
    totalItensVerificados: 15,
    divergencias: 0,
    observacoes: '100% dos ativos de TI e itens de escritório conferidos e etiquetados com QR Code.',
  },
  {
    id: 'inv-focus-002',
    codigo: 'INV-2026-Q1',
    titulo: 'Inventário Periódico de Periféricos & Licenças SaaS',
    dataInicio: '2026-03-01',
    dataFim: '2026-03-02',
    status: 'Concluído',
    responsavel: 'Equipe de Operações TI',
    totalItensEsperados: 13,
    totalItensVerificados: 13,
    divergencias: 0,
    observacoes: 'Todas as licenças corporativas validadas contra as contas dos colaboradores.',
  },
];

const INITIAL_MANUTENCOES: Manutencao[] = [
  {
    id: 'manut-focus-001',
    equipamentoId: 'eq-focus-006',
    equipamentoCodigo: 'PAT-EQ-006',
    equipamentoNome: 'Dell PowerEdge R450 Rack 1U',
    tipo: 'Preventiva',
    data: '2024-07-15',
    descricao: 'Limpeza técnica interna dos ventiladores, checagem das fontes redundantes e atualização de firmware iDRAC',
    valor: 450.0,
    responsavelId: 'tech-infra-01',
    responsavelNome: 'Assistência Técnica Homologada Dell',
    status: 'Concluído',
    laudoTecnico: 'Servidor operando em temperatura ideal de 21°C e fontes redundantes 100% operacionais.',
  },
  {
    id: 'manut-focus-002',
    equipamentoId: 'eq-focus-001',
    equipamentoCodigo: 'PAT-EQ-001',
    equipamentoNome: 'Dell Latitude 3520 15.6"',
    tipo: 'Upgrade',
    data: '2024-06-10',
    descricao: 'Upgrade de memória RAM de 8GB para 16GB Dual Channel para melhor desempenho em compilação',
    valor: 280.0,
    responsavelId: 'tech-infra-01',
    responsavelNome: 'Equipe de TI Interna',
    status: 'Concluído',
    laudoTecnico: 'Módulos Kingston DDR4 3200MHz instalados e testados com MemTest86 sem falhas.',
  },
];

const INITIAL_ESTOQUE_ITENS: EstoqueItem[] = [
  {
    id: 'esc-001',
    codigo: 'ESC-001',
    nome: 'Amazon Echo Dot (Alexa 5ª Geração)',
    descricao: 'Smart speaker com Alexa para automação de som, alarmes e recados da sala',
    categoria: 'Smart Devices & Alexa',
    quantidade: 2,
    quantidadeMinima: 1,
    estadoConservacao: 'Excelente',
    localizacao: 'Sala de Reunião Principal',
    status: 'Em Uso',
    valorUnitario: 399.0,
    responsavelNome: 'Equipe Operações',
    observacoes: 'Integrado à conta corporativa Amazon Focus',
  },
  {
    id: 'esc-002',
    codigo: 'ESC-002',
    nome: 'Smart TV 4K 55" Crystal UHD Samsung',
    descricao: 'Televisão para videoconferências, apresentações e dashboards de métricas',
    categoria: 'Audiovisual & TV',
    quantidade: 1,
    quantidadeMinima: 1,
    estadoConservacao: 'Excelente',
    localizacao: 'Sala de Apresentações',
    status: 'Em Uso',
    valorUnitario: 2699.0,
    responsavelNome: 'Diretoria Executiva',
    observacoes: 'Fixada em suporte articulado com cabo HDMI 2.1',
  },
  {
    id: 'esc-003',
    codigo: 'ESC-003',
    nome: 'Livro: Clean Code (Robert C. Martin)',
    descricao: 'Manual de Boas Práticas e Arquitetura de Software Ágil',
    categoria: 'Livros & Treinamento',
    quantidade: 3,
    quantidadeMinima: 1,
    estadoConservacao: 'Bom',
    localizacao: 'Biblioteca Focus',
    status: 'Disponível',
    valorUnitario: 98.0,
    responsavelNome: 'Líder Técnico',
    observacoes: 'Disponível para empréstimo interno da equipe',
  },
  {
    id: 'esc-004',
    codigo: 'ESC-004',
    nome: 'Livro: A Arte da Guerra (Sun Tzu)',
    descricao: 'Tratado clássico sobre estratégia, liderança e tomada de decisão',
    categoria: 'Livros & Treinamento',
    quantidade: 2,
    quantidadeMinima: 1,
    estadoConservacao: 'Excelente',
    localizacao: 'Biblioteca Focus',
    status: 'Disponível',
    valorUnitario: 45.0,
    responsavelNome: 'Comercial & Gestão',
  },
  {
    id: 'esc-005',
    codigo: 'ESC-005',
    nome: 'Cafeteira Nespresso Vertuo Pop',
    descricao: 'Cafeteira expressa em cápsulas para colaboradores e recepção de clientes',
    categoria: 'Cozinha & Convivência',
    quantidade: 1,
    quantidadeMinima: 1,
    estadoConservacao: 'Bom',
    localizacao: 'Copa / Cozinha',
    status: 'Em Uso',
    valorUnitario: 580.0,
    responsavelNome: 'Administração Predial',
  },
  {
    id: 'esc-006',
    codigo: 'ESC-006',
    nome: 'Quadro Branco Magnético 120x90cm',
    descricao: 'Lousa magnética com moldura em alumínio para dinâmicas e brainstorming',
    categoria: 'Mobiliário & Escritório',
    quantidade: 2,
    quantidadeMinima: 1,
    estadoConservacao: 'Bom',
    localizacao: 'Sala de Brainstorming',
    status: 'Em Uso',
    valorUnitario: 240.0,
    responsavelNome: 'Equipe de Produto',
  },
  {
    id: 'esc-007',
    codigo: 'ESC-007',
    nome: 'Projetor Portátil Full HD 1080p',
    descricao: 'Projetor com Wi-Fi/HDMI para reuniões com clientes e eventos externos',
    categoria: 'Audiovisual & TV',
    quantidade: 1,
    quantidadeMinima: 1,
    estadoConservacao: 'Excelente',
    localizacao: 'Armário Multiuso',
    status: 'Disponível',
    valorUnitario: 1450.0,
    responsavelNome: 'Suporte & TI',
  },
];

export function useEstoquePatrimonio() {
  const {
    data: equipamentosRaw,
    addItem: addEquipamento,
    updateItem: updateEquipamento,
    deleteItem: deleteEquipamento,
  } = useLocalStorageState<Equipamento>('focus_itam_equipamentos', INITIAL_EQUIPAMENTOS);
  const equipamentos = Array.isArray(equipamentosRaw) && equipamentosRaw.length > 0 ? equipamentosRaw : INITIAL_EQUIPAMENTOS;

  const {
    data: estoqueItensRaw,
    addItem: addEstoqueItem,
    updateItem: updateEstoqueItem,
    deleteItem: deleteEstoqueItem,
  } = useLocalStorageState<EstoqueItem>('focus_itam_estoque_itens', INITIAL_ESTOQUE_ITENS);

  // Higienizar itens para evitar itens fantasmas ou NaN
  const estoqueItens = (Array.isArray(estoqueItensRaw) && estoqueItensRaw.length > 0 ? estoqueItensRaw : INITIAL_ESTOQUE_ITENS)
    .filter(item => item && (item.nome || item.codigo))
    .map(item => ({
      ...item,
      quantidade: Number(item.quantidade) || 0,
      quantidadeMinima: Number(item.quantidadeMinima) || 0,
      valorUnitario: Number(item.valorUnitario) || 0,
      estadoConservacao: item.estadoConservacao || 'Bom',
    }));

  const {
    data: licencasRaw,
    addItem: addLicenca,
    updateItem: updateLicenca,
    deleteItem: deleteLicenca,
  } = useLocalStorageState<Licenca>('focus_itam_licencas', INITIAL_LICENCAS);
  const licencas = Array.isArray(licencasRaw) && licencasRaw.length > 0 ? licencasRaw : INITIAL_LICENCAS;

  const {
    data: patrimoniosRaw,
    addItem: addPatrimonio,
    updateItem: updatePatrimonio,
    deleteItem: deletePatrimonio,
  } = useLocalStorageState<Patrimonio>('focus_itam_patrimonios', INITIAL_PATRIMONIOS);
  const patrimonios = Array.isArray(patrimoniosRaw) && patrimoniosRaw.length > 0 ? patrimoniosRaw : INITIAL_PATRIMONIOS;

  const {
    data: movimentacoesRaw,
    addItem: addMovimentacao,
  } = useLocalStorageState<Movimentacao>('focus_itam_movimentacoes', INITIAL_MOVIMENTACOES);
  const movimentacoes = Array.isArray(movimentacoesRaw) && movimentacoesRaw.length > 0 ? movimentacoesRaw : INITIAL_MOVIMENTACOES;

  const {
    data: inventariosRaw,
    addItem: addInventario,
    updateItem: updateInventario,
    deleteItem: deleteInventario,
  } = useLocalStorageState<Inventario>('focus_itam_inventarios', INITIAL_INVENTARIOS);
  const inventarios = Array.isArray(inventariosRaw) && inventariosRaw.length > 0 ? inventariosRaw : INITIAL_INVENTARIOS;

  const {
    data: manutencoesRaw,
    addItem: addManutencao,
    updateItem: updateManutencao,
    deleteItem: deleteManutencao,
  } = useLocalStorageState<Manutencao>('focus_itam_manutencoes', INITIAL_MANUTENCOES);
  const manutencoes = Array.isArray(manutencoesRaw) && manutencoesRaw.length > 0 ? manutencoesRaw : INITIAL_MANUTENCOES;

  // Integração com Contas a Pagar e Contas a Receber
  const { addItem: addContaPagar } = useLocalStorageState<ContaPagar>('focus_contas_pagar', []);
  const { addItem: addContaReceber } = useLocalStorageState<TituloReceber>('focus_contas_receber', []);

  // Helper para gerar Conta a Pagar com persistência garantida em todos os armazenamentos
  const lancarContaPagar = (params: {
    fornecedor?: string;
    descricao: string;
    valor: number;
    vencimento?: string;
    categoria?: string;
    centroCustoNome?: string;
    centroCustoId?: string;
    formaPagamento?: any;
    observacoes?: string;
  }) => {
    const id = crypto.randomUUID();
    const numero = `PAG-${Math.floor(1000 + Math.random() * 9000)}`;
    const novaConta: ContaPagar = {
      id,
      numero,
      fornecedor: params.fornecedor || 'Fornecedor de TI / Almoxarifado',
      descricao: params.descricao,
      categoria: params.categoria || 'Licenças de Software & SaaS',
      centroCustoNome: params.centroCustoNome || 'Tecnologia da Informação',
      centroCustoId: params.centroCustoId,
      valorOriginal: params.valor,
      valorPago: 0,
      saldo: params.valor,
      valorFinal: params.valor,
      dataEmissao: new Date().toISOString().split('T')[0],
      dataVencimento: params.vencimento || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      formaPagamento: params.formaPagamento || 'Boleto',
      status: 'Pendente',
      responsavel: 'Módulo Estoque & Patrimônio',
      ultimaAtualizacao: new Date().toISOString(),
      observacoes: params.observacoes || 'Lançamento financeiro gerado automaticamente pelo módulo de Estoque & Patrimônio.',
      historico: [
        {
          id: 'h-' + Date.now(),
          data: new Date().toISOString(),
          usuario: 'Módulo Estoque & Patrimônio',
          acao: 'Criação',
          observacao: `Gerado a partir de operação no estoque/licenças: ${params.descricao}`
        }
      ]
    };

    // 1. Adicionar no hook local
    addContaPagar(novaConta);

    // 2. Gravar em todas as chaves de cache local para leitura imediata em qualquer aba
    if (typeof window !== 'undefined') {
      ['focus_app_focus_contas_pagar', 'focus_contas_pagar', 'focus_app_contas_pagar'].forEach((key) => {
        try {
          const raw = window.localStorage.getItem(key);
          const currentList = raw ? JSON.parse(raw) : [];
          if (Array.isArray(currentList)) {
            const filtered = currentList.filter((item: any) => item.id !== id);
            window.localStorage.setItem(key, JSON.stringify([novaConta, ...filtered]));
          }
        } catch {}
      });
      try {
        window.dispatchEvent(new Event('focus_storage_update'));
        window.dispatchEvent(new Event('storage'));
      } catch {}
    }

    // 3. Persistir no Supabase
    contaPagarService.saveContaPagar(novaConta as any).catch((err) => {
      console.warn('[useEstoquePatrimonio] Erro ao sincronizar conta a pagar com o banco:', err);
    });

    return novaConta;
  };

  // Helper para gerar Conta a Receber com persistência garantida em todos os armazenamentos
  const lancarContaReceber = (params: {
    cliente?: string;
    clienteId?: string;
    descricao: string;
    valor: number;
    vencimento?: string;
    categoria?: string;
    centroCustoNome?: string;
    centroCustoId?: string;
    formaPagamento?: any;
    observacoes?: string;
  }) => {
    const id = crypto.randomUUID();
    const numero = `REC-${Math.floor(1000 + Math.random() * 9000)}`;
    const novoTitulo: TituloReceber = {
      id,
      numero,
      cliente: params.cliente || 'Cliente Corporativo',
      clienteId: params.clienteId,
      descricao: params.descricao,
      categoria: params.categoria || 'Venda de Materiais & Insumos',
      centroCustoNome: params.centroCustoNome || 'Almoxarifado & Vendas',
      centroCustoId: params.centroCustoId,
      valorOriginal: params.valor,
      valorRecebido: 0,
      saldo: params.valor,
      valorLiquido: params.valor,
      dataEmissao: new Date().toISOString().split('T')[0],
      dataVencimento: params.vencimento || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      formaPagamento: params.formaPagamento || 'PIX',
      status: 'Pendente',
      responsavel: 'Módulo Estoque & Patrimônio',
      ultimaAtualizacao: new Date().toISOString(),
      observacoes: params.observacoes || 'Lançamento financeiro gerado automaticamente pelo módulo de Estoque & Patrimônio.',
      historico: [
        {
          id: 'h-' + Date.now(),
          data: new Date().toISOString(),
          usuario: 'Módulo Estoque & Patrimônio',
          acao: 'Criação',
          observacao: `Gerado a partir de saída de estoque/faturamento: ${params.descricao}`
        }
      ]
    };

    // 1. Adicionar no hook local
    addContaReceber(novoTitulo);

    // 2. Gravar em todas as chaves de cache local
    if (typeof window !== 'undefined') {
      ['focus_app_focus_contas_receber', 'focus_contas_receber', 'focus_app_contas_receber'].forEach((key) => {
        try {
          const raw = window.localStorage.getItem(key);
          const currentList = raw ? JSON.parse(raw) : [];
          if (Array.isArray(currentList)) {
            const filtered = currentList.filter((item: any) => item.id !== id);
            window.localStorage.setItem(key, JSON.stringify([novoTitulo, ...filtered]));
          }
        } catch {}
      });
      try {
        window.dispatchEvent(new Event('focus_storage_update'));
        window.dispatchEvent(new Event('storage'));
      } catch {}
    }

    // 3. Persistir no Supabase
    contaReceberService.saveContaReceber(novoTitulo as any).catch((err) => {
      console.warn('[useEstoquePatrimonio] Erro ao sincronizar conta a receber com o banco:', err);
    });

    return novoTitulo;
  };

  // Operação: Novo Equipamento
  const registrarNovoEquipamento = (eq: Omit<Equipamento, 'id' | 'createdAt'>, gerarDespesa: boolean = false, vencimentoDespesa?: string) => {
    const id = 'eq-' + Date.now();
    const newEq: Equipamento = {
      ...eq,
      id,
      createdAt: new Date().toISOString(),
      timeline: [
        {
          id: 'tm-' + Date.now(),
          dataHora: new Date().toLocaleString('pt-BR'),
          tipo: 'Aquisição',
          descricao: `Equipamento cadastrado com valor de R$ ${(eq.valorCompra || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          responsavel: eq.colaboradorNome || 'Estoque TI Central',
          usuarioRegistro: 'Administrador',
        },
      ],
    };
    addEquipamento(newEq);

    // Também cadastra no Patrimônio
    const newPatrimonio: Patrimonio = {
      id: 'pat-' + Date.now(),
      numeroPatrimonial: eq.codigoPatrimonial,
      codigoInterno: 'AST-' + id.substring(3),
      categoria: eq.categoria,
      valorCompra: eq.valorCompra,
      valorAtual: eq.valorCompra * 0.9, // depreciação inicial estimada
      vidaUtilAnos: eq.categoria === 'Notebook' || eq.categoria === 'Desktop' ? 4 : 5,
      depreciacaoAcumulada: eq.valorCompra * 0.1,
      estadoConservacao: 'Bom',
      situacao: 'Ativo',
      centroCustoNome: eq.departamento || 'TI Central',
    };
    addPatrimonio(newPatrimonio);

    // Log de Movimentação
    addMovimentacao({
      id: 'mov-' + Date.now(),
      tipo: 'Entrada',
      equipamentoId: id,
      equipamentoNome: `${eq.marca} ${eq.modelo} (${eq.codigoPatrimonial})`,
      usuarioId: 'usr-admin',
      usuarioNome: 'Administrador',
      dataHora: new Date().toLocaleString('pt-BR'),
      origem: 'Aquisição Externa',
      destino: eq.localFisica || 'Estoque Central',
      responsavelNome: eq.colaboradorNome || 'TI Central',
      observacoes: 'Cadastrado no módulo ITAM.',
    });

    if (gerarDespesa && eq.valorCompra > 0) {
      lancarContaPagar({
        fornecedor: eq.marca ? `Fornecedor ${eq.marca}` : 'Fornecedor TI',
        descricao: `Aquisição de Ativo TI: ${eq.marca} ${eq.modelo} (${eq.codigoPatrimonial})`,
        valor: eq.valorCompra,
        vencimento: vencimentoDespesa,
        categoria: 'Investimento em Ativos / TI',
        centroCustoNome: eq.departamento || 'TI / Tecnologia',
      });
    }
  };

  // Operação: Alteração de Responsável / Transferência de Equipamento
  const transferirEquipamento = (
    equipamentoId: string,
    novoResponsavel: string,
    novoDepartamento: string,
    novaLocalizacao: string,
    observacao: string
  ) => {
    const target = equipamentos.find((e) => e.id === equipamentoId);
    if (!target) return;

    const origemLocal = target.localFisica;
    const origemResp = target.colaboradorNome || 'Disponível em Estoque';

    const timelineEvent: EquipamentoTimelineEvent = {
      id: 'tm-' + Date.now(),
      dataHora: new Date().toLocaleString('pt-BR'),
      tipo: 'Mudança Responsável',
      descricao: `Transferência de responsável para ${novoResponsavel} (${novoDepartamento}). Obs: ${observacao}`,
      responsavel: novoResponsavel,
      origem: origemLocal,
      destino: novaLocalizacao,
      usuarioRegistro: 'Administrador',
    };

    updateEquipamento(equipamentoId, {
      colaboradorNome: novoResponsavel,
      departamento: novoDepartamento,
      localFisica: novaLocalizacao,
      situacao: novoResponsavel ? 'Em Uso' : 'Disponível',
      timeline: [timelineEvent, ...(target.timeline || [])],
    });

    addMovimentacao({
      id: 'mov-' + Date.now(),
      tipo: 'Transferência',
      equipamentoId,
      equipamentoNome: `${target.marca} ${target.modelo} (${target.codigoPatrimonial})`,
      usuarioId: 'usr-admin',
      usuarioNome: 'Administrador',
      dataHora: new Date().toLocaleString('pt-BR'),
      origem: `${origemResp} - ${origemLocal}`,
      destino: `${novoResponsavel} - ${novaLocalizacao}`,
      responsavelNome: novoResponsavel,
      observacoes: observacao,
    });
  };

  // Operação Completa: Entrada / Saída de Estoque Físico COM Integração Financeira
  const ajustarEstoqueItemComFinanceiro = (params: {
    itemId: string;
    quantidadeMudanca: number;
    tipoOperacao: 'Entrada' | 'Saída' | 'Ajuste';
    motivo: string;
    gerarFinanceiro: boolean;
    valorTotal: number;
    entidadeNome?: string; // Fornecedor (Entrada) ou Cliente (Saída)
    vencimento?: string;
    formaPagamento?: any;
    centroCustoId?: string;
    centroCustoNome?: string;
    categoria?: string;
  }) => {
    const item = estoqueItens.find((i) => i.id === params.itemId);
    if (!item) return;

    let novaQtd = item.quantidade;
    if (params.tipoOperacao === 'Entrada') novaQtd += params.quantidadeMudanca;
    else if (params.tipoOperacao === 'Saída') novaQtd = Math.max(0, novaQtd - params.quantidadeMudanca);
    else novaQtd = params.quantidadeMudanca;

    updateEstoqueItem(params.itemId, {
      quantidade: novaQtd,
      status: novaQtd === 0 ? 'Reservado' : 'Disponível',
    });

    // Lançamento Financeiro
    if (params.gerarFinanceiro && params.valorTotal > 0) {
      if (params.tipoOperacao === 'Entrada') {
        lancarContaPagar({
          fornecedor: params.entidadeNome || 'Fornecedor de Almoxarifado',
          descricao: `Compra/Entrada de Estoque: ${params.quantidadeMudanca}x ${item.nome} (${item.codigo})`,
          valor: params.valorTotal,
          vencimento: params.vencimento,
          categoria: params.categoria || 'Estoque & Insumos Almoxarifado',
          centroCustoNome: params.centroCustoNome || 'Operacional & Tecnologia',
          centroCustoId: params.centroCustoId,
          formaPagamento: params.formaPagamento || 'Boleto',
          observacoes: `Motivo: ${params.motivo}`,
        });
      } else if (params.tipoOperacao === 'Saída') {
        lancarContaReceber({
          cliente: params.entidadeNome || 'Cliente Faturado',
          descricao: `Venda/Faturamento de Estoque: ${params.quantidadeMudanca}x ${item.nome} (${item.codigo})`,
          valor: params.valorTotal,
          vencimento: params.vencimento,
          categoria: params.categoria || 'Venda de Materiais & Insumos',
          centroCustoNome: params.centroCustoNome || 'Comercial & Marketing',
          centroCustoId: params.centroCustoId,
          formaPagamento: params.formaPagamento || 'PIX',
          observacoes: `Motivo: ${params.motivo}`,
        });
      }
    }

    // Registro na Timeline de Movimentações
    addMovimentacao({
      id: 'mov-' + Date.now(),
      tipo: params.tipoOperacao === 'Entrada' ? 'Entrada' : params.tipoOperacao === 'Saída' ? 'Saída' : 'Transferência',
      estoqueItemId: params.itemId,
      estoqueItemNome: item.nome,
      usuarioId: 'usr-admin',
      usuarioNome: 'Administrador',
      dataHora: new Date().toLocaleString('pt-BR'),
      origem: item.localizacao,
      destino: params.motivo,
      observacoes: `${params.tipoOperacao} de ${params.quantidadeMudanca} unidade(s). Nova Qtd: ${novaQtd}. Motivo: ${params.motivo}${
        params.gerarFinanceiro ? ` • Gerado lançamento financeiro de R$ ${params.valorTotal.toFixed(2)}` : ''
      }`,
    });
  };

  // Operação: Abertura de Manutenção COM Integração Financeira
  const abrirManutencaoComFinanceiro = (params: {
    equipamentoId: string;
    tipo: 'Preventiva' | 'Corretiva' | 'Upgrade' | 'Troca';
    descricao: string;
    valor: number;
    responsavel: string;
    prestador?: string;
    gerarContaPagar?: boolean;
    gerarContaReceber?: boolean;
    clienteNome?: string;
    vencimento?: string;
    centroCustoId?: string;
    centroCustoNome?: string;
    categoria?: string;
  }) => {
    const eq = equipamentos.find((e) => e.id === params.equipamentoId);
    const eqNome = eq ? `${eq.marca} ${eq.modelo}` : 'Equipamento';
    const eqCod = eq ? eq.codigoPatrimonial : '';

    const newManut: Manutencao = {
      id: 'manut-' + Date.now(),
      equipamentoId: params.equipamentoId,
      equipamentoCodigo: eqCod,
      equipamentoNome: eqNome,
      tipo: params.tipo,
      data: new Date().toISOString().split('T')[0],
      descricao: params.descricao,
      valor: params.valor,
      responsavelId: 'tech-01',
      responsavelNome: params.responsavel,
      status: 'Em Execução',
    };

    addManutencao(newManut);

    if (eq) {
      updateEquipamento(params.equipamentoId, {
        situacao: 'Manutenção',
        timeline: [
          {
            id: 'tm-' + Date.now(),
            dataHora: new Date().toLocaleString('pt-BR'),
            tipo: 'Manutenção',
            descricao: `Ordem de manutenção [${params.tipo}] aberta. Descrição: ${params.descricao}`,
            responsavel: params.responsavel,
            usuarioRegistro: 'Administrador',
          },
          ...(eq.timeline || []),
        ],
      });
    }

    // Gera Conta a Pagar para o Prestador/Assistência se solicitado
    if (params.gerarContaPagar && params.valor > 0) {
      lancarContaPagar({
        fornecedor: params.prestador || params.responsavel || 'Assistência Técnica Especializada',
        descricao: `Serviço de Manutenção [${params.tipo}]: ${eqNome} (${eqCod})`,
        valor: params.valor,
        vencimento: params.vencimento,
        categoria: params.categoria || 'Manutenção de Equipamentos & TI',
        centroCustoNome: params.centroCustoNome || 'Operacional & Tecnologia',
        centroCustoId: params.centroCustoId,
      });
    }

    // Gera Conta a Receber se repassado/faturado para Cliente
    if (params.gerarContaReceber && params.valor > 0 && params.clienteNome) {
      lancarContaReceber({
        cliente: params.clienteNome,
        descricao: `Faturamento de Manutenção [${params.tipo}]: ${eqNome} (${eqCod})`,
        valor: params.valor,
        vencimento: params.vencimento,
        categoria: params.categoria || 'Serviços de Manutenção & Suporte',
        centroCustoNome: params.centroCustoNome || 'Operações & Serviços',
        centroCustoId: params.centroCustoId,
      });
    }

    addMovimentacao({
      id: 'mov-' + Date.now(),
      tipo: 'Manutenção',
      equipamentoId: params.equipamentoId,
      equipamentoNome: `${eqNome} (${eqCod})`,
      usuarioId: 'usr-admin',
      usuarioNome: 'Administrador',
      dataHora: new Date().toLocaleString('pt-BR'),
      destino: `Assistência / Tech: ${params.responsavel}`,
      observacoes: `Manutenção ${params.tipo}. Custo: R$ ${params.valor}${
        params.gerarContaPagar ? ' • Conta a Pagar gerada' : ''
      }${params.gerarContaReceber ? ' • Conta a Receber gerada' : ''}`,
    });
  };

  // Operação: Cadastro de Licença COM Integração Financeira
  const criarLicencaComFinanceiro = (params: {
    licenca: Omit<Licenca, 'id'>;
    gerarContaPagar?: boolean;
    gerarContaReceber?: boolean;
    clienteNome?: string;
    vencimentoFinanceiro?: string;
    categoria?: string;
  }) => {
    const id = 'lic-' + Date.now();
    const novaLicenca: Licenca = {
      ...params.licenca,
      id,
    };
    addLicenca(novaLicenca);

    // Despesa em Contas a Pagar
    if (params.gerarContaPagar && params.licenca.valor > 0) {
      lancarContaPagar({
        fornecedor: params.licenca.fabricante || 'Fornecedor de Software / SaaS',
        descricao: `Assinatura de Software/Licença: ${params.licenca.nome} (${params.licenca.plano})`,
        valor: params.licenca.valor,
        vencimento: params.vencimentoFinanceiro || params.licenca.vencimento,
        categoria: params.categoria || 'Licenciamento de Software',
        centroCustoNome: params.licenca.centroCustoNome || 'Operacional & Tecnologia',
        centroCustoId: params.licenca.centroCustoId,
      });
    }

    // Faturamento em Contas a Receber (se repassado a cliente)
    if (params.gerarContaReceber && params.licenca.valor > 0 && params.clienteNome) {
      lancarContaReceber({
        cliente: params.clienteNome,
        descricao: `Repasse de Licença de Software: ${params.licenca.nome} (${params.licenca.plano})`,
        valor: params.licenca.valor,
        vencimento: params.vencimentoFinanceiro || params.licenca.vencimento,
        categoria: params.categoria || 'Licenciamento de Software',
        centroCustoNome: params.licenca.centroCustoNome || 'Comercial & Marketing',
        centroCustoId: params.licenca.centroCustoId,
      });
    }

    return novaLicenca;
  };

  return {
    equipamentos,
    estoqueItens,
    licencas,
    patrimonios,
    movimentacoes,
    inventarios,
    manutencoes,
    addEquipamento,
    updateEquipamento,
    deleteEquipamento,
    registrarNovoEquipamento,
    transferirEquipamento,
    addEstoqueItem,
    updateEstoqueItem,
    deleteEstoqueItem,
    ajustarEstoqueItemComFinanceiro,
    addLicenca,
    updateLicenca,
    deleteLicenca,
    criarLicencaComFinanceiro,
    addPatrimonio,
    updatePatrimonio,
    deletePatrimonio,
    addInventario,
    updateInventario,
    deleteInventario,
    addManutencao,
    updateManutencao,
    deleteManutencao,
    abrirManutencaoComFinanceiro,
    lancarContaPagar,
    lancarContaReceber,
  };
}
