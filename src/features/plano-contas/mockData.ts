import { CategoriaFinanceira } from './types';

export const INITIAL_CATEGORIAS: CategoriaFinanceira[] = [
  // 1. RECEITAS
  {
    id: 'cat-rec-1',
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
    id: 'cat-rec-1-1',
    codigo: '1.1',
    nome: 'Serviços & Consultoria',
    parentId: 'cat-rec-1',
    tipo: 'Receita',
    natureza: 'Operacional',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Desenvolvimento sob medida, consultoria e projetos.'
  },
  {
    id: 'cat-rec-1-2',
    codigo: '1.2',
    nome: 'Mensalidades & Recorrências',
    parentId: 'cat-rec-1',
    tipo: 'Receita',
    natureza: 'Operacional',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Planos mensais, assinaturas e contratos recorrentes de clientes.'
  },
  {
    id: 'cat-rec-1-3',
    codigo: '1.3',
    nome: 'Licenciamento de Software',
    parentId: 'cat-rec-1',
    tipo: 'Receita',
    natureza: 'Operacional',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Licenças de uso de software e módulos adicionais.'
  },
  {
    id: 'cat-rec-1-4',
    codigo: '1.4',
    nome: 'Treinamento & Suporte Dedicado',
    parentId: 'cat-rec-1',
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
    id: 'cat-desp-2',
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
    id: 'cat-desp-2-1',
    codigo: '2.1',
    nome: 'Infraestrutura & Cloud',
    parentId: 'cat-desp-2',
    tipo: 'Despesa',
    natureza: 'Operacional',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Hospedagem em nuvem (AWS, GCP, Vercel), servidores e CDN.'
  },
  {
    id: 'cat-desp-2-2',
    codigo: '2.2',
    nome: 'Licenças de Software & Ferramentas',
    parentId: 'cat-desp-2',
    tipo: 'Despesa',
    natureza: 'Operacional',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Softwares SaaS de produtividade, IDEs, CRMs e plataformas.'
  },
  {
    id: 'cat-desp-2-3',
    codigo: '2.3',
    nome: 'Marketing & Vendas',
    parentId: 'cat-desp-2',
    tipo: 'Despesa',
    natureza: 'Comercial',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Tráfego pago (Google Ads, Meta), eventos, inbound e comissões.'
  },
  {
    id: 'cat-desp-2-4',
    codigo: '2.4',
    nome: 'Folha de Pagamento & Benefícios',
    parentId: 'cat-desp-2',
    tipo: 'Despesa',
    natureza: 'Administrativa',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Salários, encargos trabalhistas, benefícios e pró-labore.'
  },
  {
    id: 'cat-desp-2-5',
    codigo: '2.5',
    nome: 'Impostos & Tributos',
    parentId: 'cat-desp-2',
    tipo: 'Despesa',
    natureza: 'Tributária',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Simples Nacional, ISS, PIS/COFINS, IRPJ/CSLL.'
  },
  {
    id: 'cat-desp-2-6',
    codigo: '2.6',
    nome: 'Serviços Terceiros & Consultoria',
    parentId: 'cat-desp-2',
    tipo: 'Despesa',
    natureza: 'Administrativa',
    status: 'Ativa',
    dataAtualizacao: new Date().toISOString(),
    qtdLancamentos: 0,
    saldoAcumuladoMensal: 0,
    descricao: 'Contabilidade terceirizada, assessoria jurídica e consultores.'
  },
  {
    id: 'cat-desp-2-7',
    codigo: '2.7',
    nome: 'Operacional & Escritório',
    parentId: 'cat-desp-2',
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
