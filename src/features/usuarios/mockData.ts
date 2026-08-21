import { IAMDashboard, Usuario, MatrizPermissoes } from './types';
import { INITIAL_USUARIOS, superAdminPermissoes } from './data/initialData';

export const mockIAMDashboard: IAMDashboard = {
  totalUsuarios: 1,
  ativos: 1,
  inativos: 0,
  bloqueados: 0,
  administradores: 1,
  onlineAgora: 1,
  tentativasFalhas24h: 0,
  perfisCriados: 1,
};

export const mockUsuarios: Usuario[] = INITIAL_USUARIOS;
