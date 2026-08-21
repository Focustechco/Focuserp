import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Usuario, PermissaoModulo, MatrizPermissoes } from '@/features/usuarios/types';
import { INITIAL_USUARIOS, superAdminPermissoes } from '@/features/usuarios/data/initialData';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';
import { toast } from 'sonner';

interface AuthContextType {
  currentUser: Usuario;
  isSuperAdmin: boolean;
  usuarios: Usuario[];
  login: (email: string, senha: string) => { success: boolean; error?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  hasPermission: (modulo: keyof MatrizPermissoes, action?: keyof PermissaoModulo) => boolean;
  canAccessRoute: (pathname: string) => boolean;
  updateCurrentUserProfile: (data: Partial<Usuario>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROUTE_PERMISSION_MAP: Record<string, keyof MatrizPermissoes> = {
  '/': 'dashboard',
  '/fluxo-de-caixa': 'fluxoCaixa',
  '/contas-a-receber': 'contasReceber',
  '/contas-a-pagar': 'contasPagar',
  '/cobrancas': 'cobrancas',
  '/conciliacao': 'conciliacao',
  '/agenda': 'agenda',
  '/clientes': 'clientes',
  '/fornecedores': 'fornecedores',
  '/centro-de-custos': 'centroCustos',
  '/categorias': 'planoContas',
  '/projetos': 'projetos',
  '/desenvolvimento': 'projetos',
  '/dre': 'dre',
  '/indicadores': 'kpis',
  '/relatorios': 'kpis',
  '/contratos': 'contratos',
  '/assinaturas': 'contratos',
  '/usuarios': 'administracao',
  '/permissoes': 'administracao',
  '/configuracoes': 'administracao',
  '/integracoes': 'administracao',
  '/rh': 'administracao',
  '/produtos': 'dashboard',
  '/suporte': 'dashboard',
  '/comercial': 'cobrancas',
  '/crm': 'clientes',
  '/customer-success': 'clientes',
  '/estoque': 'administracao',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: usuarios, updateItem } = useLocalStorageState<Usuario>('focus_usuarios', INITIAL_USUARIOS);

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = safeGetItem('focus_session_user_id');
      if (saved) return saved;
    }
    return INITIAL_USUARIOS[0].id;
  });

  // Sincronizar e manter a sessão no storage
  useEffect(() => {
    if (typeof window !== 'undefined' && currentUserId) {
      safeSetItem('focus_session_user_id', currentUserId);
    }
  }, [currentUserId]);

  const currentUser = useMemo<Usuario>(() => {
    const found = (usuarios || []).find(u => u.id === currentUserId);
    if (found) return found;
    return (usuarios && usuarios.length > 0) ? usuarios[0] : INITIAL_USUARIOS[0];
  }, [usuarios, currentUserId]);

  const isSuperAdmin = useMemo(() => {
    if (!currentUser) return true;
    return (
      currentUser.perfil === 'Super Administrador' ||
      currentUser.cargo?.toLowerCase().includes('ceo') ||
      currentUser.cargo?.toLowerCase().includes('diretor') ||
      currentUser.id === INITIAL_USUARIOS[0].id
    );
  }, [currentUser]);

  const login = (email: string, senha: string) => {
    const user = (usuarios || []).find(
      u => u.email?.toLowerCase().trim() === email?.toLowerCase().trim()
    );

    if (!user) {
      return { success: false, error: 'E-mail não encontrado no diretório corporativo.' };
    }

    if (user.status === 'Inativo' || user.status === 'Bloqueado') {
      return { success: false, error: `Este usuário está com o status [${user.status}]. Acesso negado.` };
    }

    // Se o usuário possui senha cadastrada, validar; senão aceita para facilitar transição
    if (user.senha && user.senha !== senha) {
      return { success: false, error: 'Senha incorreta. Verifique suas credenciais.' };
    }

    setCurrentUserId(user.id);
    safeSetItem('focus_session_user_id', user.id);
    updateItem(user.id, { ultimoLogin: new Date().toISOString() });
    toast.success(`Bem-vindo, ${user.nome}!`);
    return { success: true };
  };

  const logout = () => {
    // Retornar à conta principal ou limpar
    const defaultUser = INITIAL_USUARIOS[0];
    setCurrentUserId(defaultUser.id);
    safeSetItem('focus_session_user_id', defaultUser.id);
    toast.info('Sessão encerrada.');
  };

  const switchUser = (userId: string) => {
    const target = (usuarios || []).find(u => u.id === userId);
    if (target) {
      setCurrentUserId(target.id);
      safeSetItem('focus_session_user_id', target.id);
      toast.success(`Sessão alternada para: ${target.nome} (${target.perfil})`);
    }
  };

  const hasPermission = (modulo: keyof MatrizPermissoes, action: keyof PermissaoModulo = 'visualizar'): boolean => {
    if (isSuperAdmin) return true;
    if (!currentUser || !currentUser.permissoes) return false;
    const moduloPerms = currentUser.permissoes[modulo];
    if (!moduloPerms) return false;
    return Boolean(moduloPerms[action]);
  };

  const canAccessRoute = (pathname: string): boolean => {
    if (isSuperAdmin) return true;
    
    // Rotas de governança exclusiva de Super Admin
    if (pathname === '/usuarios' || pathname === '/permissoes') {
      return isSuperAdmin;
    }

    const modulo = ROUTE_PERMISSION_MAP[pathname];
    if (!modulo) return true; // Rotas abertas

    return hasPermission(modulo, 'visualizar');
  };

  const updateCurrentUserProfile = (data: Partial<Usuario>) => {
    if (currentUser?.id) {
      updateItem(currentUser.id, data);
      toast.success('Perfil atualizado com sucesso!');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isSuperAdmin,
        usuarios: usuarios || INITIAL_USUARIOS,
        login,
        logout,
        switchUser,
        hasPermission,
        canAccessRoute,
        updateCurrentUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
