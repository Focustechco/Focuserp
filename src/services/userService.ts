import { supabase } from '@/lib/supabaseClient';
import { Usuario } from '@/features/usuarios/types';
import { INITIAL_USUARIOS } from '@/features/usuarios/data/initialData';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';

const USERS_STORAGE_KEY = 'focus_app_focus_usuarios';
const USERS_STATE_ROW_ID = '00000000-0000-4000-a000-000075736572'; // deterministic UUID for users state backup

function broadcastUsersUpdate() {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new Event('focus_users_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  }
}

/**
 * Service Central de Governança de Usuários e Autenticação
 * 100% Persistido no Banco de Dados Supabase / PostgreSQL com Sincronização Realtime Mobile (iOS/Android) e Desktop.
 */
export const userService = {
  /**
   * Buscar todos os usuários cadastrados diretamente do Banco de Dados
   */
  async getUsers(): Promise<Usuario[]> {
    const userMap = new Map<string, Usuario>();

    // 1. Carregar base inicial padrão
    INITIAL_USUARIOS.forEach((u) => {
      userMap.set(u.email.toLowerCase().trim(), u);
    });

    // 2. Tentar carregar do cache local imediato
    try {
      const rawLocal = safeGetItem(USERS_STORAGE_KEY) || safeGetItem('focus_usuarios');
      if (rawLocal) {
        const localList: Usuario[] = JSON.parse(rawLocal);
        if (Array.isArray(localList)) {
          localList.forEach((u) => {
            if (u && u.email) {
              const key = u.email.toLowerCase().trim();
              const existing = userMap.get(key);
              userMap.set(key, { ...existing, ...u });
            }
          });
        }
      }
    } catch {}

    // 3. Buscar do Banco de Dados Supabase (Tabela users)
    try {
      const { data: dbUsers, error: usersErr } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!usersErr && Array.isArray(dbUsers) && dbUsers.length > 0) {
        dbUsers.forEach((item: any) => {
          if (item && (item.email || item.nome)) {
            const emailKey = (item.email || '').toLowerCase().trim();
            const existing = userMap.get(emailKey);

            const mapped: Usuario = {
              id: item.id || existing?.id || crypto.randomUUID(),
              nome: item.nome || item.name || existing?.nome || 'Usuário',
              nomeExibicao: item.nome_exibicao || item.nome || existing?.nomeExibicao || item.name || 'Usuário',
              email: item.email || existing?.email || '',
              senha: item.senha || existing?.senha || 'Focus@2026',
              telefone: item.telefone || existing?.telefone || '',
              foto: item.foto || item.avatar_url || existing?.foto || '',
              cargo: item.cargo || existing?.cargo || 'Colaborador Focus',
              departamento: item.departamento || existing?.departamento || 'Geral',
              matricula: item.matricula || existing?.matricula || `FT-${Math.floor(100 + Math.random() * 900)}`,
              status: item.status === 'Inativo' ? 'Inativo' : item.status === 'Bloqueado' ? 'Bloqueado' : 'Ativo',
              perfil: item.perfil || existing?.perfil || 'Financeiro',
              rolesComplementares: item.roles_complementares || existing?.rolesComplementares || [],
              mfaHabilitado: Boolean(item.mfa_habilitado ?? existing?.mfaHabilitado ?? true),
              ultimoLogin: item.ultimo_login || existing?.ultimoLogin || new Date().toISOString(),
              tentativasFalhas: item.tentativas_falhas || existing?.tentativasFalhas || 0,
              sessoes: item.sessoes || existing?.sessoes || [],
              permissoes: item.permissoes || existing?.permissoes || (INITIAL_USUARIOS[0].permissoes as any),
              auditoria: item.auditoria || existing?.auditoria || [],
            };

            if (emailKey) {
              userMap.set(emailKey, mapped);
            }
          }
        });
      }
    } catch (e) {
      console.warn('[userService.getUsers] Aviso ao consultar tabela users:', e);
    }

    // 4. Buscar do Banco de Dados Supabase (Tabela de Estado Global / Cloud Backup usando maybeSingle)
    try {
      const { data: cloudState } = await supabase
        .from('clients')
        .select('*')
        .eq('id', USERS_STATE_ROW_ID)
        .maybeSingle();

      if (cloudState && cloudState.name && cloudState.name.startsWith('__FOCUS_USERS_STATE__:')) {
        const jsonStr = cloudState.name.replace('__FOCUS_USERS_STATE__:', '');
        const parsed: Usuario[] = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          parsed.forEach((u) => {
            if (u && u.email) {
              const key = u.email.toLowerCase().trim();
              const existing = userMap.get(key);
              userMap.set(key, { ...existing, ...u });
            }
          });
        }
      }
    } catch {}

    const finalList = Array.from(userMap.values());
    
    // Atualizar cache local
    safeSetItem(USERS_STORAGE_KEY, JSON.stringify(finalList));
    safeSetItem('focus_usuarios', JSON.stringify(finalList));

    return finalList;
  },

  /**
   * Salvar usuário completamente no Banco de Dados Supabase e disparar sincronização Realtime
   */
  async saveUser(user: Usuario): Promise<Usuario> {
    const users = await this.getUsers();
    const emailKey = user.email.toLowerCase().trim();

    const filtered = users.filter((u) => u.email.toLowerCase().trim() !== emailKey && u.id !== user.id);
    const updatedList = [user, ...filtered];

    // 1. Atualizar cache imediato
    safeSetItem(USERS_STORAGE_KEY, JSON.stringify(updatedList));
    safeSetItem('focus_usuarios', JSON.stringify(updatedList));
    broadcastUsersUpdate();

    // 2. Persistir no Supabase (Tabela users)
    try {
      const payload = {
        id: user.id,
        nome: user.nome,
        nome_exibicao: user.nomeExibicao || user.nome,
        email: user.email,
        telefone: user.telefone,
        foto: user.foto,
        cargo: user.cargo,
        departamento: user.departamento,
        matricula: user.matricula,
        status: user.status,
        perfil: user.perfil,
        roles_complementares: user.rolesComplementares,
        mfa_habilitado: user.mfaHabilitado,
        ultimo_login: user.ultimoLogin,
        tentativas_falhas: user.tentativasFalhas,
        permissoes: user.permissoes,
        updated_at: new Date().toISOString(),
      };

      await supabase.from('users').upsert(payload);
    } catch (err: any) {
      console.warn('[userService.saveUser] Aviso ao salvar em users:', err?.message);
    }

    // 3. Persistir Cloud Backup no Supabase para sincronização universal (iOS / Android / Desktop)
    try {
      await supabase.from('clients').upsert({
        id: USERS_STATE_ROW_ID,
        name: `__FOCUS_USERS_STATE__:${JSON.stringify(updatedList)}`,
        status: 'system_state',
        updated_at: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn('[userService.saveUser] Aviso ao salvar cloud state:', err?.message);
    }

    return user;
  },

  /**
   * Salvar múltiplos usuários
   */
  async saveAllUsers(users: Usuario[]): Promise<void> {
    safeSetItem(USERS_STORAGE_KEY, JSON.stringify(users));
    safeSetItem('focus_usuarios', JSON.stringify(users));
    broadcastUsersUpdate();

    try {
      await supabase.from('clients').upsert({
        id: USERS_STATE_ROW_ID,
        name: `__FOCUS_USERS_STATE__:${JSON.stringify(users)}`,
        status: 'system_state',
        updated_at: new Date().toISOString(),
      });
    } catch {}
  },

  /**
   * Atualizar Perfil de Usuário com foto, nome, cargo, etc.
   */
  async updateUserProfile(userIdOrEmail: string, patch: Partial<Usuario>): Promise<Usuario | null> {
    const users = await this.getUsers();
    const target = users.find(
      (u) =>
        u.id === userIdOrEmail ||
        u.email.toLowerCase().trim() === userIdOrEmail.toLowerCase().trim()
    );

    if (!target) return null;

    const updatedUser: Usuario = {
      ...target,
      ...patch,
    };

    await this.saveUser(updatedUser);
    return updatedUser;
  },

  /**
   * Upload de Foto de Perfil Otimizada para o Banco de Dados e Storage
   * Compatível com Web, iOS e Android em tempo real
   */
  async uploadUserAvatar(userIdOrEmail: string, file: File | Blob): Promise<string> {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (!src) return resolve('');
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 256;
          let w = img.width;
          let h = img.height;
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.88));
          } else {
            resolve(src);
          }
        };
        img.onerror = () => resolve(src);
        img.src = src;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    let finalFotoUrl = base64Data;

    try {
      const fileName = `avatar_${userIdOrEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.jpg`;
      const { data: uploadRes, error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (!uploadErr && uploadRes) {
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(uploadRes.path);

        if (publicUrlData?.publicUrl) {
          finalFotoUrl = publicUrlData.publicUrl;
        }
      }
    } catch {}

    await this.updateUserProfile(userIdOrEmail, { foto: finalFotoUrl });
    return finalFotoUrl;
  },

  /**
   * Assinar alterações de usuários em tempo real via Supabase Realtime (Cross-device Sync Mobile / Desktop)
   */
  subscribeUsers(onUpdate: (users: Usuario[]) => void) {
    if (typeof window === 'undefined') return () => {};

    const handleLocalEvent = async () => {
      try {
        const users = await this.getUsers();
        onUpdate(users);
      } catch {}
    };

    window.addEventListener('focus_users_updated', handleLocalEvent);
    window.addEventListener('storage', handleLocalEvent);

    // Canal Realtime do Supabase com identificador único por instância
    const uniqueChannelName = `focus_users_rt_${Math.random().toString(36).substring(2, 9)}`;
    let channel: any = null;

    try {
      channel = supabase
        .channel(uniqueChannelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'users' },
          async () => {
            try {
              const fresh = await userService.getUsers();
              onUpdate(fresh);
            } catch {}
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'clients', filter: `id=eq.${USERS_STATE_ROW_ID}` },
          async () => {
            try {
              const fresh = await userService.getUsers();
              onUpdate(fresh);
            } catch {}
          }
        );

      channel.subscribe();
    } catch (e) {
      console.warn('[userService.subscribeUsers] Erro ao criar canal realtime:', e);
    }

    return () => {
      window.removeEventListener('focus_users_updated', handleLocalEvent);
      window.removeEventListener('storage', handleLocalEvent);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  },
};
