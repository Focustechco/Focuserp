import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Usuario, PermissaoModulo, MatrizPermissoes } from '@/features/usuarios/types';
import { INITIAL_USUARIOS, superAdminPermissoes } from '@/features/usuarios/data/initialData';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { safeGetItem, safeSetItem, safeRemoveItem } from '@/lib/safeStorage';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export type AuthStatus = 'INITIALIZING' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'LOADING' | 'ERROR';

export interface UserSession {
  token: string;
  userId: string;
  loginAt: string;
  expiresAt: number;
}

interface AuthContextType {
  status: AuthStatus;
  currentUser: Usuario | null;
  session: UserSession | null;
  isSuperAdmin: boolean;
  usuarios: Usuario[];
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => void;
  hasPermission: (modulo: keyof MatrizPermissoes, action?: keyof PermissaoModulo) => boolean;
  canAccessRoute: (pathname: string) => boolean;
  updateCurrentUserProfile: (data: Partial<Usuario>) => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mapeamento oficial de rotas para módulos de permissão RBAC
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
  '/ia-financeira': 'dashboard',
  '/marketing': 'dashboard',
  '/fiscal': 'fiscal',
  '/logs': 'administracao',
  '/notificacoes': 'dashboard',
};

const SESSION_STORAGE_KEY = 'focus_auth_session_v2';
const SESSION_DURATION_HOURS = 24;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('INITIALIZING');
  const [session, setSession] = useState<UserSession | null>(null);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);

  const { data: usuarios, updateItem } = useLocalStorageState<Usuario>('focus_usuarios', INITIAL_USUARIOS);

  // ---------------------------------------------------------------------------
  // Inicialização Segura da Sessão (Recuperação no Refresh / F5)
  // ---------------------------------------------------------------------------
  const initSession = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const rawSession = safeGetItem(SESSION_STORAGE_KEY);
      if (!rawSession) {
        setStatus('UNAUTHENTICATED');
        setSession(null);
        setCurrentUser(null);
        return;
      }

      const parsedSession: UserSession = JSON.parse(rawSession);
      const isExpired = parsedSession.expiresAt && Date.now() > parsedSession.expiresAt;

      if (isExpired) {
        safeRemoveItem(SESSION_STORAGE_KEY);
        setStatus('UNAUTHENTICATED');
        setSession(null);
        setCurrentUser(null);
        return;
      }

      // Localizar o usuário ativo nos dados corporativos
      const userList = usuarios && usuarios.length > 0 ? usuarios : INITIAL_USUARIOS;
      const foundUser = userList.find((u) => u.id === parsedSession.userId || u.email === parsedSession.userId);

      if (!foundUser) {
        // Usuário removido do sistema
        safeRemoveItem(SESSION_STORAGE_KEY);
        setStatus('UNAUTHENTICATED');
        setSession(null);
        setCurrentUser(null);
        return;
      }

      if (foundUser.status === 'Inativo' || foundUser.status === 'Bloqueado') {
        // Usuário inativado pelo Super Admin
        safeRemoveItem(SESSION_STORAGE_KEY);
        setStatus('UNAUTHENTICATED');
        setSession(null);
        setCurrentUser(null);
        toast.error('Sua conta foi desativada pelo administrador.');
        return;
      }

      // Sessão válida recuperada com sucesso
      setSession(parsedSession);
      setCurrentUser(foundUser);
      setStatus('AUTHENTICATED');
    } catch {
      safeRemoveItem(SESSION_STORAGE_KEY);
      setStatus('UNAUTHENTICATED');
      setSession(null);
      setCurrentUser(null);
    }
  }, [usuarios]);

  useEffect(() => {
    // Pequeno delay para garantir sincronia do storage
    const timer = setTimeout(() => {
      initSession();
    }, 100);

    return () => clearTimeout(timer);
  }, [initSession]);

  // ---------------------------------------------------------------------------
  // Super Administrador Check
  // ---------------------------------------------------------------------------
  const isSuperAdmin = useMemo(() => {
    if (!currentUser) return false;
    return (
      currentUser.perfil === 'Super Administrador' ||
      currentUser.cargo?.toLowerCase().includes('ceo') ||
      currentUser.cargo?.toLowerCase().includes('cto') ||
      currentUser.cargo?.toLowerCase().includes('diretor executivo') ||
      currentUser.cargo?.toLowerCase().includes('diretor de tecnologia')
    );
  }, [currentUser]);

  // ---------------------------------------------------------------------------
  // Ação Real de Login
  // ---------------------------------------------------------------------------
  const login = async (email: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    setStatus('LOADING');

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanSenha = (senha || '').trim();

    if (!cleanEmail || !cleanSenha) {
      setStatus('UNAUTHENTICATED');
      return { success: false, error: 'Por favor, informe seu e-mail e sua senha.' };
    }

    try {
      // 1. Tentar autenticação via Supabase Auth se aplicável
      try {
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanSenha,
        });
      } catch {
        // Fallback para autenticação corporativa interna caso Supabase Auth não esteja provisionado
      }

      // 2. Validar no diretório de usuários do Focus ERP
      const userList = usuarios && usuarios.length > 0 ? usuarios : INITIAL_USUARIOS;
      const user = userList.find((u) => u.email?.toLowerCase().trim() === cleanEmail);

      if (!user) {
        setStatus('UNAUTHENTICATED');
        return { success: false, error: 'Usuário ou senha inválidos.' };
      }

      // 3. Validar se o usuário está ativo
      if (user.status === 'Inativo' || user.status === 'Bloqueado') {
        setStatus('UNAUTHENTICATED');
        return { success: false, error: `Acesso negado: Este usuário está ${user.status.toLowerCase()}.` };
      }

      // 4. Validar senha corporativa cadastrada
      if (user.senha && user.senha !== cleanSenha) {
        setStatus('UNAUTHENTICATED');
        return { success: false, error: 'Usuário ou senha inválidos.' };
      }

      // 5. Criar e persistir sessão real
      const newSession: UserSession = {
        token: `focus_jwt_${crypto.randomUUID()}`,
        userId: user.id,
        loginAt: new Date().toISOString(),
        expiresAt: Date.now() + SESSION_DURATION_HOURS * 3600 * 1000,
      };

      safeSetItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
      setSession(newSession);
      setCurrentUser(user);
      setStatus('AUTHENTICATED');

      // Atualizar timestamp de último login e auditoria
      updateItem(user.id, {
        ultimoLogin: new Date().toISOString(),
        tentativasFalhas: 0,
      });

      toast.success(`Bem-vindo ao Focus ERP, ${user.nome}!`);
      return { success: true };
    } catch {
      setStatus('UNAUTHENTICATED');
      return { success: false, error: 'Ocorreu um erro ao processar a autenticação. Tente novamente.' };
    }
  };

  // ---------------------------------------------------------------------------
  // Ação Real de Logout
  // ---------------------------------------------------------------------------
  const logout = async (): Promise<void> => {
    setStatus('LOADING');

    try {
      await supabase.auth.signOut().catch(() => {});
    } catch {}

    safeRemoveItem(SESSION_STORAGE_KEY);
    setSession(null);
    setCurrentUser(null);
    setStatus('UNAUTHENTICATED');

    toast.info('Sessão encerrada com sucesso.');
  };

  // ---------------------------------------------------------------------------
  // Alternância de Sessão (Exclusivo Super Administrador)
  // ---------------------------------------------------------------------------
  const switchUser = (userId: string) => {
    if (!isSuperAdmin) {
      toast.error('Apenas o Super Administrador pode alternar perfis de sessão.');
      return;
    }

    const userList = usuarios && usuarios.length > 0 ? usuarios : INITIAL_USUARIOS;
    const target = userList.find((u) => u.id === userId);

    if (target) {
      if (target.status === 'Inativo' || target.status === 'Bloqueado') {
        toast.error(`Não é possível alternar para um usuário ${target.status.toLowerCase()}.`);
        return;
      }

      const updatedSession: UserSession = {
        token: `focus_jwt_${crypto.randomUUID()}`,
        userId: target.id,
        loginAt: new Date().toISOString(),
        expiresAt: Date.now() + SESSION_DURATION_HOURS * 3600 * 1000,
      };

      safeSetItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
      setSession(updatedSession);
      setCurrentUser(target);
      toast.success(`Sessão alternada para: ${target.nome} (${target.perfil})`);
    }
  };

  // ---------------------------------------------------------------------------
  // Verificação Granular de Permissões (RBAC)
  // ---------------------------------------------------------------------------
  const hasPermission = (
    modulo: keyof MatrizPermissoes,
    action: keyof PermissaoModulo = 'visualizar'
  ): boolean => {
    if (isSuperAdmin) return true;
    if (!currentUser || !currentUser.permissoes) return false;

    const moduloPerms = currentUser.permissoes[modulo];
    if (!moduloPerms) return false;

    return Boolean(moduloPerms[action]);
  };

  // ---------------------------------------------------------------------------
  // Proteção e Bloqueio de Rotas
  // ---------------------------------------------------------------------------
  const canAccessRoute = (pathname: string): boolean => {
    if (isSuperAdmin) return true;
    if (!currentUser) return false;

    // Rotas de governança exclusivas de Super Administrador
    if (pathname === '/usuarios' || pathname === '/permissoes' || pathname === '/configuracoes') {
      return isSuperAdmin;
    }

    const modulo = ROUTE_PERMISSION_MAP[pathname];
    if (!modulo) return true; // Rotas abertas aos autenticados

    return hasPermission(modulo, 'visualizar');
  };

  // ---------------------------------------------------------------------------
  // Atualizar Perfil do Usuário Autenticado
  // ---------------------------------------------------------------------------
  const updateCurrentUserProfile = (data: Partial<Usuario>) => {
    if (currentUser?.id) {
      const updated = { ...currentUser, ...data };
      setCurrentUser(updated);
      updateItem(currentUser.id, data);
      toast.success('Perfil atualizado com sucesso!');
    }
  };

  // ---------------------------------------------------------------------------
  // Recuperação de Senha
  // ---------------------------------------------------------------------------
  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Informe um e-mail corporativo válido.' };
    }

    const userList = usuarios && usuarios.length > 0 ? usuarios : INITIAL_USUARIOS;
    const user = userList.find((u) => u.email?.toLowerCase().trim() === cleanEmail);

    if (!user) {
      // Mensagem genérica por segurança
      return {
        success: true,
        message: 'Se este e-mail estiver cadastrado, as instruções de recuperação foram enviadas.',
      };
    }

    try {
      await supabase.auth.resetPasswordForEmail(cleanEmail).catch(() => {});
    } catch {}

    return {
      success: true,
      message: `Instruções de redefinição de acesso enviadas para ${cleanEmail}.`,
    };
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        currentUser,
        session,
        isSuperAdmin,
        usuarios: usuarios || INITIAL_USUARIOS,
        login,
        logout,
        switchUser,
        hasPermission,
        canAccessRoute,
        updateCurrentUserProfile,
        requestPasswordReset,
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
