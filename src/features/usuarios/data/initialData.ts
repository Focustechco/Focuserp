import { Usuario, MatrizPermissoes } from '../types';

const fullAccess = {
  visualizar: true,
  criar: true,
  editar: true,
  excluir: true,
  aprovar: true,
  exportar: true,
  importar: true,
  imprimir: true,
};

export const superAdminPermissoes: MatrizPermissoes = {
  dashboard: fullAccess,
  contasReceber: fullAccess,
  contasPagar: fullAccess,
  cobrancas: fullAccess,
  fluxoCaixa: fullAccess,
  clientes: fullAccess,
  fornecedores: fullAccess,
  projetos: fullAccess,
  contratos: fullAccess,
  centroCustos: fullAccess,
  planoContas: fullAccess,
  fiscal: fullAccess,
  agenda: fullAccess,
  conciliacao: fullAccess,
  dre: fullAccess,
  kpis: fullAccess,
  administracao: fullAccess,
};

export const INITIAL_USUARIOS: Usuario[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    nome: 'Adriano Leal',
    nomeExibicao: 'Adriano Leal',
    email: 'adriano.leal@focustecnologia.com.br',
    telefone: '(11) 99888-7766',
    cargo: 'CEO / Diretor Executivo',
    departamento: 'Diretoria',
    matricula: 'FT-001',
    status: 'Ativo',
    perfil: 'Super Administrador',
    rolesComplementares: ['Financeiro', 'Projetos', 'Comercial'],
    mfaHabilitado: true,
    ultimoLogin: new Date().toISOString(),
    tentativasFalhas: 0,
    sessoes: [],
    permissoes: superAdminPermissoes,
    auditoria: [],
  },
];
