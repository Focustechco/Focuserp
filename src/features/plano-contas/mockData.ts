import { CategoriaFinanceira } from './types';

export const INITIAL_CATEGORIAS: CategoriaFinanceira[] = [
  // 1. RECEITAS
  {
    id: '67013282-9ab2-480f-b9bb-66ac2e1671fe',
    codigo: '1.0',
    nome: 'Receitas Operacionais',
    tipo: 'Receita',
    natureza: 'Operacional',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Receitas brutas de prestação de serviços, SaaS e contratos.'
  },
  {
    id: '8b8aee0d-7156-495f-ba1b-b48de6bc3387',
    codigo: '1.1',
    nome: 'Serviços & Consultoria',
    parentId: '67013282-9ab2-480f-b9bb-66ac2e1671fe',
    tipo: 'Receita',
    natureza: 'Operacional',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Desenvolvimento sob medida, consultoria e projetos.'
  },
  {
    id: 'e3bcb9ab-3c86-4069-85b0-3a053076f4c2',
    codigo: '1.2',
    nome: 'Mensalidades & Recorrências',
    parentId: '67013282-9ab2-480f-b9bb-66ac2e1671fe',
    tipo: 'Receita',
    natureza: 'Operacional',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Planos mensais, assinaturas e contratos recorrentes de clientes.'
  },
  {
    id: 'ff5ad360-b081-4036-a491-920c0b8615a7',
    codigo: '1.3',
    nome: 'Licenciamento de Software',
    parentId: '67013282-9ab2-480f-b9bb-66ac2e1671fe',
    tipo: 'Receita',
    natureza: 'Operacional',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Licenças de uso de software e módulos adicionais.'
  },
  {
    id: '3f8ad564-d0ee-4f4b-bc5c-2d4db2a8885f',
    codigo: '1.4',
    nome: 'Treinamento & Suporte Dedicado',
    parentId: '67013282-9ab2-480f-b9bb-66ac2e1671fe',
    tipo: 'Receita',
    natureza: 'Operacional',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Capacitações técnicas, SLAs dedicados e suporte 24/7.'
  },

  // 2. DESPESAS
  {
    id: '404b3d39-5a81-40b2-9641-9a4833b0ddf5',
    codigo: '2.0',
    nome: 'Despesas Operacionais',
    tipo: 'Despesa',
    natureza: 'Operacional',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Custos diretos e operacionais da operação.'
  },
  {
    id: '7971db07-14d2-4819-b822-6a0d46b9c8d8',
    codigo: '2.1',
    nome: 'Infraestrutura & Cloud',
    parentId: '404b3d39-5a81-40b2-9641-9a4833b0ddf5',
    tipo: 'Despesa',
    natureza: 'Operacional',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Hospedagem em nuvem (AWS, GCP, Vercel), servidores e CDN.'
  },
  {
    id: 'aa1c814f-6faf-4251-8b2e-c50141a9e4e7',
    codigo: '2.2',
    nome: 'Licenças de Software & Ferramentas',
    parentId: '404b3d39-5a81-40b2-9641-9a4833b0ddf5',
    tipo: 'Despesa',
    natureza: 'Operacional',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Softwares SaaS de produtividade, IDEs, CRMs e plataformas.'
  },
  {
    id: '761a0962-2dfc-49d9-a84d-77b02ff15dd5',
    codigo: '2.3',
    nome: 'Marketing & Vendas',
    parentId: '404b3d39-5a81-40b2-9641-9a4833b0ddf5',
    tipo: 'Despesa',
    natureza: 'Comercial',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Tráfego pago (Google Ads, Meta), eventos, inbound e comissões.'
  },
  {
    id: 'aff0e904-9bcc-4efa-8443-8b1be4e64508',
    codigo: '2.4',
    nome: 'Folha de Pagamento & Benefícios',
    parentId: '404b3d39-5a81-40b2-9641-9a4833b0ddf5',
    tipo: 'Despesa',
    natureza: 'Administrativa',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Salários, encargos trabalhistas, benefícios e pró-labore.'
  },
  {
    id: '71b86cb2-20f1-4eb3-a90c-550bb2f8abbf',
    codigo: '2.5',
    nome: 'Impostos & Tributos',
    parentId: '404b3d39-5a81-40b2-9641-9a4833b0ddf5',
    tipo: 'Despesa',
    natureza: 'Tributária',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Simples Nacional, ISS, PIS/COFINS, IRPJ/CSLL.'
  },
  {
    id: '9c0bacf0-c98b-46fb-ae64-ba9f8f883706',
    codigo: '2.6',
    nome: 'Serviços Terceiros & Consultoria',
    parentId: '404b3d39-5a81-40b2-9641-9a4833b0ddf5',
    tipo: 'Despesa',
    natureza: 'Administrativa',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Contabilidade terceirizada, assessoria jurídica e consultores.'
  },
  {
    id: '2678a0e9-5270-47aa-ac7a-6b86f715df8a',
    codigo: '2.7',
    nome: 'Operacional & Escritório',
    parentId: '404b3d39-5a81-40b2-9641-9a4833b0ddf5',
    tipo: 'Despesa',
    natureza: 'Administrativa',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Aluguel, contas de consumo, internet e materiais.'
  }
];

export const mockPlanoContas: CategoriaFinanceira[] = INITIAL_CATEGORIAS;
