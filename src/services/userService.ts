import { supabase } from '@/lib/supabaseClient';
import { Usuario } from '@/features/usuarios/types';
import { INITIAL_USUARIOS } from '@/features/usuarios/data/initialData';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';

const USERS_STORAGE_KEY = 'focus_app_focus_usuarios';

function broadcastUsersUpdate() {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new Event('focus_users_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  }
}

// Converte string base64 para Blob binário para upload no Supabase Storage
function base64ToBlob(base64: string, contentType = 'image/jpeg'): Blob {
  const byteCharacters = atob(base64.split(',')[1] || base64);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: contentType });
}

// Gera um UUID determinístico válido a partir de uma chave string
function generateDeterministicUuid(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(12, '0').slice(-12);
  return `00000000-0000-4000-a000-${hex}`;
}

/**
 * Service Central de Governança de Usuários e Autenticação
 * 100% Persistido no Banco de Dados Relacional Supabase / PostgreSQL com Sincronização Realtime Mobile (iOS/Android) e Desktop.
 */
export const userService = {
  /**
   * Buscar todos os usuários cadastrados diretamente do Banco de Dados Relacional
   */
  async getUsers(): Promise<Usuario[]> {
    const userMap = new Map<string, Usuario>();

    // 1. Carregar base corporativa padrão
    INITIAL_USUARIOS.forEach((u) => {
      userMap.set(u.email.toLowerCase().trim(), u);
    });

    // 2. Carregar do cache local imediato
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

            const fotoFromDb = item.foto || item.avatar_url || item.avatar || '';

            const mapped: Usuario = {
              id: item.id || existing?.id || crypto.randomUUID(),
              nome: item.nome || item.name || existing?.nome || 'Usuário',
              nomeExibicao: item.nome_exibicao || item.nome || existing?.nomeExibicao || item.name || 'Usuário',
              email: item.email || existing?.email || '',
              senha: item.senha || existing?.senha || 'Focus@2026',
              telefone: item.telefone || existing?.telefone || '',
              foto: fotoFromDb || existing?.foto || '',
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

    // 4. Buscar fotos e dados de perfil persistidos na tabela relacional 'clients' (profile rows)
    try {
      const { data: profileRows, error: profileErr } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'user_profile');

      if (!profileErr && Array.isArray(profileRows) && profileRows.length > 0) {
        profileRows.forEach((row: any) => {
          if (row.contact_email) {
            const emailKey = row.contact_email.toLowerCase().trim();
            const existing = userMap.get(emailKey);
            if (existing) {
              const photoUrl = row.contact_phone || '';
              if (photoUrl && (!existing.foto || existing.foto.startsWith('data:') || photoUrl.startsWith('http'))) {
                existing.foto = photoUrl;
              }
              if (row.name && row.name.trim()) {
                existing.nome = row.name;
                existing.nomeExibicao = row.name;
              }
            }
          }
        });
      }
    } catch {}

    // 5. Buscar fotos sincronizadas na tabela relacional 'colaboradores' (se colunas existirem)
    try {
      const { data: colabsData, error: colabsErr } = await supabase
        .from('colaboradores')
        .select('*');

      if (!colabsErr && Array.isArray(colabsData) && colabsData.length > 0) {
        colabsData.forEach((colab: any) => {
          if (colab.email) {
            const emailKey = colab.email.toLowerCase().trim();
            const existing = userMap.get(emailKey);
            if (existing && colab.foto) {
              if (!existing.foto || colab.foto.startsWith('http')) {
                existing.foto = colab.foto;
              }
            }
          }
        });
      }
    } catch {}

    const finalList = Array.from(userMap.values());
    
    // Atualizar cache local
    safeSetItem(USERS_STORAGE_KEY, JSON.stringify(finalList));
    safeSetItem('focus_usuarios', JSON.stringify(finalList));

    return finalList;
  },

  /**
   * Salvar usuário completamente no Banco de Dados Relacional Supabase e disparar sincronização Realtime
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
        foto: user.foto || null,
        avatar_url: user.foto || null,
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

      await supabase.from('users').upsert(payload, { onConflict: 'id' });
    } catch (err: any) {
      console.warn('[userService.saveUser] Aviso ao salvar em users:', err?.message);
    }

    // 3. Persistir registro relacional de perfil do usuário na tabela 'clients' (para espelhamento 100% resiliente em mobile)
    try {
      const profileRowId = generateDeterministicUuid(user.email.toLowerCase().trim());
      await supabase.from('clients').upsert({
        id: profileRowId,
        name: user.nome || user.nomeExibicao || 'Usuário Focus',
        status: 'user_profile',
        contact_email: user.email.toLowerCase().trim(),
        contact_phone: user.foto || '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (err: any) {
      console.warn('[userService.saveUser] Aviso ao espelhar profile row em clients:', err?.message);
    }

    // 4. Se o usuário existir na tabela colaboradores, atualizar foto lá também
    try {
      await supabase
        .from('colaboradores')
        .update({
          foto: user.foto || null,
          updated_at: new Date().toISOString(),
        })
        .ilike('email', user.email.trim());
    } catch {}

    return user;
  },

  /**
   * Salvar múltiplos usuários
   */
  async saveAllUsers(users: Usuario[]): Promise<void> {
    safeSetItem(USERS_STORAGE_KEY, JSON.stringify(users));
    safeSetItem('focus_usuarios', JSON.stringify(users));
    broadcastUsersUpdate();

    for (const u of users) {
      await this.saveUser(u);
    }
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
   * Upload de Foto de Perfil Otimizada para o Supabase Storage e Banco de Dados Relacional
   * Compatível com Web, iOS e Android com sincronização instantânea
   */
  async uploadUserAvatar(userIdOrEmail: string, fileOrBase64: File | Blob | string): Promise<string> {
    let blob: Blob;
    let base64Preview = '';

    // Se for string base64
    if (typeof fileOrBase64 === 'string') {
      base64Preview = fileOrBase64;
      blob = base64ToBlob(fileOrBase64, 'image/jpeg');
    } else {
      blob = fileOrBase64;
    }

    // Comprimir imagem para tamanho leve e alta resolução
    const compressedBlob = await new Promise<Blob>((resolve) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        base64Preview = src;
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
            canvas.toBlob((b) => resolve(b || blob), 'image/jpeg', 0.88);
          } else {
            resolve(blob);
          }
        };
        img.onerror = () => resolve(blob);
        img.src = src;
      };
      reader.onerror = () => resolve(blob);
      reader.readAsDataURL(blob);
    });

    let finalFotoUrl = base64Preview;

    const sanitizedId = userIdOrEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileName = `avatar_${sanitizedId}_${Date.now()}.jpg`;

    // Tentar upload nos buckets do Supabase Storage ('avatars', 'documents', 'public')
    const bucketsToTry = ['avatars', 'documents', 'public'];
    let uploadedSuccessfully = false;

    for (const bucket of bucketsToTry) {
      try {
        const { data: uploadRes, error: uploadErr } = await supabase.storage
          .from(bucket)
          .upload(fileName, compressedBlob, {
            upsert: true,
            contentType: 'image/jpeg',
          });

        if (!uploadErr && uploadRes) {
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(uploadRes.path);

          if (publicUrlData?.publicUrl) {
            finalFotoUrl = publicUrlData.publicUrl;
            uploadedSuccessfully = true;
            break;
          }
        }
      } catch (err) {
        console.warn(`[uploadUserAvatar] Tentativa no bucket '${bucket}' falhou:`, err);
      }
    }

    // Atualizar no Banco de Dados Relacional Supabase
    await this.updateUserProfile(userIdOrEmail, { foto: finalFotoUrl });
    broadcastUsersUpdate();

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
          { event: '*', schema: 'public', table: 'clients', filter: `status=eq.user_profile` },
          async () => {
            try {
              const fresh = await userService.getUsers();
              onUpdate(fresh);
            } catch {}
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'colaboradores' },
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
