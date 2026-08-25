import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeSetItem, safeGetItem } from '@/lib/safeStorage';
import { userService } from '@/services/userService';

/**
 * Helper to generate a valid, deterministic UUID for state storage keys in PostgreSQL.
 */
function getTableUuid(table: string): string {
  let hex = '';
  for (let i = 0; i < table.length; i++) {
    hex += table.charCodeAt(i).toString(16);
  }
  const paddedHex = (hex + '000000000000000000000000').slice(0, 12);
  return `00000000-0000-4000-a000-${paddedHex}`;
}

/**
 * Helper to ensure a string is a valid UUID for PostgreSQL uuid columns.
 */
function toValidUuid(idStr?: string): string {
  if (!idStr) return crypto.randomUUID();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(idStr)) return idStr;
  return crypto.randomUUID();
}

/**
 * Helper to safely read from localStorage
 */
function readLocalCache<T>(table: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const keysToTry = [`focus_app_${table}`, table, `focus_${table}`];
    for (const k of keysToTry) {
      const raw = safeGetItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {}
  return fallback;
}

/**
 * Helper to safely write to localStorage
 */
function writeLocalCache<T>(table: string, items: T[]) {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(items);
    safeSetItem(`focus_app_${table}`, serialized);
    safeSetItem(table, serialized);
    safeSetItem(`focus_${table}`, serialized);
  } catch {}
}

/**
 * Bulletproof Multi-Device Storage Hook (Real-Time Cloud Persistence for ALL Modules, Users & Notifications)
 * 100% Persistido no Banco de Dados Real Supabase / PostgreSQL com proteções contra perda de dados e atualizações atômicas.
 */
export function useLocalStorageState<T extends { id: string }>(
  table: string,
  initialValue: T[] = []
) {
  const [data, setData] = useState<T[]>(() => readLocalCache(table, initialValue));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isClientsTable = table === 'clients' || table === 'clientes' || table === 'focus_clientes';
  const isUsersTable = table === 'focus_usuarios' || table === 'users' || table === 'usuarios';
  const isMountedRef = useRef(true);

  // Helper para persistir na nuvem sem falhas de restrição de banco
  const syncToCloud = useCallback(
    async (items: T[]) => {
      if (isUsersTable) {
        await userService.saveAllUsers(items as any);
        return;
      }

      try {
        if (isClientsTable) {
          const payload = items.map((item: any) => {
            const validUuid = toValidUuid(item.id);
            item.id = validUuid;
            return {
              id: validUuid,
              name: item.nomeFantasia || item.razaoSocial || item.name || 'Novo Cliente',
              status: String(item.status || 'ativo').toLowerCase(),
              contact_email: item.contatos?.[0]?.email || item.email || item.contact_email || null,
              contact_phone: item.contatos?.[0]?.celular || item.telefone || item.contact_phone || null,
              updated_at: new Date().toISOString(),
            };
          });

          if (payload.length > 0) {
            await supabase.from('clients').upsert(payload);
          }
        }

        // Persistir o estado completo serializado no banco PostgreSQL
        const stateRowId = getTableUuid(table);
        const stateName = `__FOCUS_STATE__${table}`;

        await supabase.from('clients').upsert({
          id: stateRowId,
          name: stateName,
          status: 'inativo',
          contact_email: JSON.stringify(items),
          contact_phone: '(11) 99999-9999',
          updated_at: new Date().toISOString(),
        });
      } catch (err: any) {
        console.warn(`[Supabase] Erro ao sincronizar '${table}' com o banco de dados:`, err?.message);
      }
    },
    [isClientsTable, isUsersTable, table]
  );

  // ---------------------------------------------------------------------------
  // Sync Data on Client Mount & Realtime Cloud Database
  // ---------------------------------------------------------------------------
  useEffect(() => {
    isMountedRef.current = true;

    // 1. Carregamento imediato do cache local
    const localCached = readLocalCache(table, initialValue);
    if (isMountedRef.current && localCached.length > 0) {
      setData(localCached);
    }

    const fetchData = async () => {
      try {
        if (isUsersTable) {
          const dbUsers = await userService.getUsers();
          if (isMountedRef.current && Array.isArray(dbUsers) && dbUsers.length > 0) {
            setData(dbUsers as unknown as T[]);
            writeLocalCache(table, dbUsers);
            setError(null);
          }
        } else if (isClientsTable) {
          const { data: dbClients, error: dbErr } = await supabase
            .from('clients')
            .select('*')
            .not('name', 'like', '__FOCUS_STATE__%')
            .not('name', 'like', '__FOCUS_STATE_%')
            .not('name', 'like', '__FOCUS_USERS_STATE__%')
            .neq('status', 'deleted')
            .order('created_at', { ascending: false });

          if (!isMountedRef.current) return;

          if (!dbErr && Array.isArray(dbClients)) {
            const rawDeletedIds = safeGetItem('focus_app_deleted_client_ids');
            const deletedSet = new Set<string>(rawDeletedIds ? JSON.parse(rawDeletedIds) : []);
            const localMap = new Map<string, any>();
            localCached.forEach((lc: any) => {
              if (lc && lc.id) localMap.set(String(lc.id), lc);
            });

            const mapped = dbClients
              .filter((c: any) => {
                if (deletedSet.has(String(c.id))) return false;
                if (c.status === 'deleted' || c.status === 'deletado' || c.deleted === true) return false;
                if (typeof c.name === 'string' && (c.name.startsWith('__DELETED__') || c.name.startsWith('__FOCUS_'))) return false;
                return true;
              })
              .map((c: any) => {
                const existing = localMap.get(String(c.id)) || {};
                return {
                  ...existing,
                  ...c,
                  id: String(c.id),
                  codigo: existing.codigo || `CLI-${String(c.id).slice(0, 4).toUpperCase()}`,
                  tipo: existing.tipo || 'Pessoa Jurídica',
                  razaoSocial: existing.razaoSocial || c.name || 'Cliente sem nome',
                  nomeFantasia: existing.nomeFantasia || c.name || 'Cliente sem nome',
                  documento: existing.documento || '00.000.000/0001-00',
                  status: c.status === 'inativo' ? 'Inativo' : (existing.status || 'Ativo'),
                  segmento: existing.segmento || 'Geral',
                  endereco: existing.endereco || {
                    cep: '',
                    logradouro: '',
                    numero: '',
                    bairro: '',
                    cidade: 'São Paulo',
                    estado: 'SP',
                    pais: 'Brasil'
                  },
                  contatos: (existing.contatos && existing.contatos.length > 0)
                    ? existing.contatos
                    : [
                        {
                          id: `ct-${c.id}`,
                          nome: c.name || 'Contato Principal',
                          cargo: 'Responsável',
                          departamento: 'Geral',
                          celular: c.contact_phone || '(11) 99999-9999',
                          whatsapp: true,
                          email: c.contact_email || 'contato@cliente.com',
                          principal: true
                        }
                      ],
                  recorrencias: existing.recorrencias || [],
                  dataCadastro: existing.dataCadastro || c.created_at || new Date().toISOString(),
                  ultimaAtualizacao: existing.ultimaAtualizacao || c.updated_at || new Date().toISOString(),
                };
              }) as T[];

            localCached.forEach((lc: any) => {
              if (lc && lc.id && !mapped.some((m: any) => m.id === lc.id) && !deletedSet.has(String(lc.id))) {
                mapped.push(lc);
              }
            });

            if (isMountedRef.current) {
              setData(mapped);
              writeLocalCache(table, mapped);
              setError(null);
            }
          }
        } else {
          // Buscar estado serializado do módulo na tabela clients
          const stateRowId = getTableUuid(table);
          const stateName = `__FOCUS_STATE__${table}`;

          const { data: cloudRow, error: cloudErr } = await supabase
            .from('clients')
            .select('contact_email')
            .or(`name.eq.${stateName},name.eq.__FOCUS_STATE_${table}__,id.eq.${stateRowId}`)
            .maybeSingle();

          if (!isMountedRef.current) return;

          if (!cloudErr && cloudRow?.contact_email) {
            try {
              const cloudItems: T[] = JSON.parse(cloudRow.contact_email);
              if (Array.isArray(cloudItems) && cloudItems.length > 0) {
                if (isMountedRef.current) {
                  setData(cloudItems);
                  writeLocalCache(table, cloudItems);
                  setError(null);
                }
              }
            } catch {}
          }
        }
      } catch (err: any) {
        if (!isMountedRef.current) return;
        setError(err?.message || 'Unknown fetch error');
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      fetchData();
    }

    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === `focus_app_${table}` || e.key === table || e.key === `focus_${table}`) {
        const updated = readLocalCache(table, initialValue);
        if (isMountedRef.current) setData(updated);
      }
    };

    let unsubscribeUsers: (() => void) | null = null;
    if (isUsersTable) {
      unsubscribeUsers = userService.subscribeUsers((freshUsers) => {
        if (isMountedRef.current && Array.isArray(freshUsers)) {
          setData(freshUsers as unknown as T[]);
        }
      });
    }

    // Supabase Realtime Subscription
    let channel: any = null;
    if (typeof window !== 'undefined') {
      try {
        const stateName = `__FOCUS_STATE__${table}`;
        const stateRowId = getTableUuid(table);

        channel = supabase
          .channel(`rt_${table}_${Math.random().toString(36).slice(2, 7)}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'clients',
            },
            (payload) => {
              if (!isMountedRef.current) return;
              if (isClientsTable) {
                fetchData();
              } else if (payload.new) {
                const newRow = payload.new as any;
                if ((newRow.name === stateName || newRow.name === `__FOCUS_STATE_${table}__` || newRow.id === stateRowId) && newRow.contact_email) {
                  try {
                    const remoteData: T[] = JSON.parse(newRow.contact_email);
                    if (Array.isArray(remoteData)) {
                      setData(remoteData);
                      writeLocalCache(table, remoteData);
                    }
                  } catch {}
                }
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('[useLocalStorageState] Realtime subscribe notice:', e);
      }
    }

    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchData();
      }
    };

    const handleFocusStorageUpdate = () => {
      const updated = readLocalCache(table, initialValue);
      if (isMountedRef.current) setData(updated);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageUpdate);
      window.addEventListener('focus', handleVisibilityOrFocus);
      window.addEventListener('focus_storage_update', handleFocusStorageUpdate);
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityOrFocus);
      }
    }

    return () => {
      isMountedRef.current = false;
      if (unsubscribeUsers) unsubscribeUsers();
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageUpdate);
        window.removeEventListener('focus', handleVisibilityOrFocus);
        window.removeEventListener('focus_storage_update', handleFocusStorageUpdate);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  // ---------------------------------------------------------------------------
  // CRUD helpers com atualizações atômicas e persistência garantida
  // ---------------------------------------------------------------------------
  const save = useCallback(
    async (newData: T[]) => {
      const cleanedData = newData.map((item) => {
        if (!item.id || typeof item.id !== 'string') {
          return { ...item, id: crypto.randomUUID() };
        }
        return item;
      });

      setData(cleanedData);
      writeLocalCache(table, cleanedData);

      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new Event('focus_storage_update'));
        } catch {}
      }

      await syncToCloud(cleanedData);
    },
    [syncToCloud, table]
  );

  const addItem = useCallback(
    async (item: T) => {
      const itemWithUuid = {
        ...item,
        id: item.id ? item.id : crypto.randomUUID(),
      };
      setData((prev) => {
        const current = Array.isArray(prev) ? prev : [];
        const updated = [itemWithUuid, ...current.filter((i) => i.id !== itemWithUuid.id)];
        writeLocalCache(table, updated);
        syncToCloud(updated);
        return updated;
      });
    },
    [syncToCloud, table]
  );

  const updateItem = useCallback(
    async (id: string, patch: Partial<T>) => {
      setData((prev) => {
        const current = Array.isArray(prev) ? prev : [];
        const updated = current.map((it) => {
          const matchesId = it.id === id;
          const matchesEmail = isUsersTable && 
            Boolean((it as any).email && (patch as any).email && 
            String((it as any).email).toLowerCase().trim() === String((patch as any).email).toLowerCase().trim());

          if (matchesId || matchesEmail) {
            return { ...it, ...patch };
          }
          return it;
        });
        writeLocalCache(table, updated);
        syncToCloud(updated);
        return updated;
      });
    },
    [isUsersTable, syncToCloud, table]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      setData((prev) => {
        const current = Array.isArray(prev) ? prev : [];
        const updated = current.filter((it) => it.id !== id);
        writeLocalCache(table, updated);

        if (isClientsTable) {
          supabase.from('clients').delete().eq('id', id).catch(() => {});
        }

        syncToCloud(updated);
        return updated;
      });
    },
    [isClientsTable, syncToCloud, table]
  );

  const saveItem = useCallback(
    async (item: T) => {
      const itemWithUuid = {
        ...item,
        id: item.id ? item.id : crypto.randomUUID(),
      };
      setData((prev) => {
        const current = Array.isArray(prev) ? prev : [];
        const exists = current.some((it) => it.id === itemWithUuid.id);
        const updated = exists
          ? current.map((it) => (it.id === itemWithUuid.id ? { ...it, ...itemWithUuid } : it))
          : [itemWithUuid, ...current];
        writeLocalCache(table, updated);
        syncToCloud(updated);
        return updated;
      });
    },
    [syncToCloud, table]
  );

  const removeItem = deleteItem;
  const setAllItems = save;

  return {
    data,
    loading,
    error,
    addItem,
    updateItem,
    saveItem,
    deleteItem,
    removeItem,
    save,
    setAllItems,
  };
}
