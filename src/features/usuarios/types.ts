export type UserStatus = 'Ativo' | 'Inativo' | 'Bloqueado';
export type UserProfile = 'Super Administrador' | 'Administrador Financeiro' | 'Financeiro' | 'Comercial' | 'Projetos' | 'Diretoria' | 'Auditor' | 'Personalizado';

export interface PermissaoModulo {
  visualizar: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
  aprovar: boolean;
  exportar: boolean;
  importar: boolean;
  imprimir: boolean;
}

export interface MatrizPermissoes {
  dashboard: PermissaoModulo;
  contasReceber: PermissaoModulo;
  contasPagar: PermissaoModulo;
  cobrancas: PermissaoModulo;
  fluxoCaixa: PermissaoModulo;
  clientes: PermissaoModulo;
  fornecedores: PermissaoModulo;
  projetos: PermissaoModulo;
  contratos: PermissaoModulo;
  centroCustos: PermissaoModulo;
  planoContas: PermissaoModulo;
  fiscal: PermissaoModulo;
  agenda: PermissaoModulo;
  conciliacao: PermissaoModulo;
  dre: PermissaoModulo;
  kpis: PermissaoModulo;
  administracao: PermissaoModulo;
}

export interface SessaoAtiva {
  id: string;
  navegador: string;
  so: string;
  ip: string;
  cidade: string;
  ultimaAtividade: string;
  loginEm: string;
}

export interface AuditoriaLog {
  id: string;
  dataHora: string;
  acao: string;
  modulo: string;
  ip: string;
  dispositivo: string;
  detalhes: string;
}

export interface Usuario {
  id: string;
  foto?: string;
  nome: string;
  nomeExibicao: string;
  email: string;
  senha?: string;
  telefone?: string;
  cargo: string;
  departamento: string;
  matricula?: string;
  status: UserStatus;
  perfil: UserProfile;
  rolesComplementares: string[];
  mfaHabilitado: boolean;
  ultimoLogin?: string;
  tentativasFalhas: number;
  sessoes: SessaoAtiva[];
  permissoes: MatrizPermissoes;
  auditoria: AuditoriaLog[];
}

export interface IAMDashboard {
  totalUsuarios: number;
  ativos: number;
  inativos: number;
  bloqueados: number;
  administradores: number;
  onlineAgora: number;
  tentativasFalhas24h: number;
  perfisCriados: number;
}
