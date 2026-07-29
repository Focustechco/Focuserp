import { supabase } from '@/lib/supabaseClient';
import { userSchema, activeUserSchema, UserDTO, ActiveUserDTO } from '@/schemas/userSchema';

export const userService = {
  /**
   * Buscar todos os usuários cadastrados
   */
  async getUsers(): Promise<UserDTO[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => {
          const mapped = {
            id: item.id,
            tenantId: item.tenant_id,
            keycloakSub: item.keycloak_sub,
            authUserId: item.auth_user_id,
            nome: item.nome || item.name || 'Usuário',
            nomeExibicao: item.nome_exibicao || item.nome,
            email: item.email || '',
            telefone: item.telefone,
            foto: item.foto,
            cargo: item.cargo || 'Usuário',
            departamento: item.departamento || 'Geral',
            matricula: item.matricula,
            status: item.status === 'Inativo' ? 'Inativo' : item.status === 'Bloqueado' ? 'Bloqueado' : 'Ativo',
            perfil: item.perfil || 'Financeiro',
            rolesComplementares: item.roles_complementares || [],
            mfaHabilitado: Boolean(item.mfa_habilitado),
            ultimoLogin: item.ultimo_login,
            tentativasFalhas: item.tentativas_falhas || 0,
            permissoes: item.permissoes || {},
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          };
          const parsed = userSchema.safeParse(mapped);
          if (parsed.success) {
            return parsed.data;
          }
          console.error(`[userService.getUsers] Falha na validação do usuário ${item.id}:`, parsed.error.format());
          return null;
        }).filter((item): item is UserDTO => item !== null);
      }

      // Fallback para LocalStorage
      const rawLocal = typeof window !== 'undefined' ? window.localStorage.getItem('focus_usuarios') : null;
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed)) return parsed;
      }

      return [];
    } catch (err) {
      console.error('[userService.getUsers] Erro ao buscar usuários:', err);
      return [];
    }
  },

  /**
   * Obter perfil do usuário ativo atual
   */
  async getCurrentUser(): Promise<ActiveUserDTO | null> {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', authData.user.id)
          .single();

        if (dbUser) {
          const mapped = {
            id: dbUser.id,
            nome: dbUser.nome || authData.user.user_metadata?.full_name || 'Usuário',
            email: dbUser.email || authData.user.email || '',
            cargo: dbUser.cargo || 'Usuário',
            departamento: dbUser.departamento || 'Geral',
            perfil: dbUser.perfil || 'Financeiro',
            foto: dbUser.foto,
            tenantId: dbUser.tenant_id,
          };
          const parsed = activeUserSchema.safeParse(mapped);
          if (parsed.success) return parsed.data;
        }
      }

      // Fallback para LocalStorage active user
      const rawActive = typeof window !== 'undefined' ? window.localStorage.getItem('focus_active_user') : null;
      if (rawActive) {
        const parsedLocal = JSON.parse(rawActive);
        const parsed = activeUserSchema.safeParse(parsedLocal);
        if (parsed.success) return parsed.data;
      }

      return null;
    } catch (err) {
      console.error('[userService.getCurrentUser] Erro ao obter usuário atual:', err);
      return null;
    }
  },

  /**
   * Salvar ou atualizar usuário
   */
  async saveUser(user: UserDTO): Promise<UserDTO> {
    const validated = userSchema.parse(user);
    const id = validated.id || crypto.randomUUID();

    const payload = {
      id,
      tenant_id: validated.tenantId,
      keycloak_sub: validated.keycloakSub,
      auth_user_id: validated.authUserId,
      nome: validated.nome,
      nome_exibicao: validated.nomeExibicao || validated.nome,
      email: validated.email,
      telefone: validated.telefone,
      foto: validated.foto,
      cargo: validated.cargo,
      departamento: validated.departamento,
      matricula: validated.matricula,
      status: validated.status,
      perfil: validated.perfil,
      roles_complementares: validated.rolesComplementares,
      mfa_habilitado: validated.mfaHabilitado,
      ultimo_login: validated.ultimoLogin,
      tentativas_falhas: validated.tentativasFalhas,
      permissoes: validated.permissoes,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('users').upsert(payload);
    if (error) {
      console.error('[userService.saveUser] Erro ao salvar usuário:', error);
      throw new Error(`Falha ao salvar usuário: ${error.message}`);
    }

    return { ...validated, id };
  },

  /**
   * Atualizar perfil do usuário por ID
   */
  async updateUserProfile(id: string, profileData: Partial<UserDTO>): Promise<UserDTO> {
    const existingUsers = await this.getUsers();
    const existing = existingUsers.find(u => u.id === id) || {
      id,
      nome: 'Usuário',
      email: 'usuario@focus.com',
      status: 'Ativo' as const,
      perfil: 'Financeiro',
      cargo: 'Usuário',
      departamento: 'Geral',
      rolesComplementares: [],
      mfaHabilitado: false,
      tentativasFalhas: 0,
      permissoes: {},
    };

    const updated = { ...existing, ...profileData, id };
    return this.saveUser(updated);
  }
};
