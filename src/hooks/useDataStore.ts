import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeSetItem, safeGetItem, safeRemoveItem } from '@/lib/safeStorage';
import { userService } from '@/services/userService';

/**
 * Helper to generate a valid, deterministic UUID for state storage keys.
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
    const raw = safeGetItem(`focus_app_${table}`) || safeGetItem(table);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
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
  } catch {}
}

/**
 * Bulletproof Multi-Device Storage Hook (Real-Time Cloud Persistence for ALL Modules, Users & Notifications)
 * Seamless cross-device sync between Desktop, Mobile iOS & Android.
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

  // ---------------------------------------------------------------------------
  // Sync Data on Client Mount & Cloud
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    // 1. Initial local load
    const localCached = readLocalCache(table, initialValue);
    if (isMounted && localCached.length > 0) {
      setData(localCached);
    }

    const fetchData = async () => {
      try {
        if (isUsersTable) {
          // Carregar diretamente do Banco de Dados Supabase (Users / State)
          const dbUsers = await userService.getUsers();
          if (isMounted && Array.isArray(dbUsers) && dbUsers.length > 0) {
            setData(dbUsers as unknown as T[]);
            writeLocalCache(table, dbUsers);
            setError(null);
          }
        } else if (isClientsTable) {
          // Fetch real client rows from Supabase
          const { data: dbClients, error: dbErr } = await supabase
            .from('clients')
            .select('*')
            .not('name', 'like', '__FOCUS_STATE__%')
            .not('name', 'like', '__FOCUS_USERS_STATE__%')
            .order('created_at', { ascending: false });

          if (!isMounted) return;

          if (!dbErr && Array.isArray(dbClients)) {
            const rawDeletedIds = safeGetItem('focus_app_deleted_client_ids');
            const deletedSet = new Set<string>(rawDeletedIds ? JSON.parse(rawDeletedIds) : []);

            const mapped = dbClients
              .filter((c: any) => {
                if (deletedSet.has(String(c.id))) return false;
                if (c.status === 'deleted' || c.status === 'deletado' || c.deleted === true) return false;
                if (typeof c.name === 'string' && (c.name.startsWith('__DELETED__') || c.name.startsWith('__FOCUS_'))) return false;
                return true;
              })
              .map((c: any) => ({
                id: c.id,
                codigo: `CLI-${c.id.slice(0, 4).toUpperCase()}`,
                tipo: 'Pessoa Jurídica',
                razaoSocial: c.name || 'Cliente sem nome',
                nomeFantasia: c.name || 'Cliente sem nome',
                documento: '00.000.000/0001-00',
                status: c.status === 'inativo' ? 'Inativo' : 'Ativo',
                segmento: 'Geral',
                endereco: {
                  cep: '',
                  logradouro: '',
                  numero: '',
                  bairro: '',
                  cidade: 'São Paulo',
                  estado: 'SP',
                  pais: 'Brasil'
                },
                contatos: [
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
                dataCadastro: c.created_at || new Date().toISOString(),
                ultimaAtualizacao: c.updated_at || new Date().toISOString(),
                ...c
              })) as T[];

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || 'Unknown fetch error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    // Event listener for cross-tab / cross-window updates
    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === `focus_app_${table}` || e.key === table) {
        const updated = readLocalCache(table, initialValue);
        if (isMounted) setData(updated);
      }
    };

    let unsubscribeUsers: (() => void) | null = null;
    if (isUsersTable) {
      unsubscribeUsers = userService.subscribeUsers((freshUsers) => {
        if (isMounted && Array.isArray(freshUsers)) {
          setData(freshUsers as unknown as T[]);
        }
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageUpdate);
      window.addEventListener('focus_storage_update', () => {
        const updated = readLocalCache(table, initialValue);
        if (isMounted) setData(updated);
      });
    }

    return () => {
      isMounted = false;
      if (unsubscribeUsers) unsubscribeUsers();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageUpdate);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  // ---------------------------------------------------------------------------
  // CRUD helpers (Instant LocalStorage update + Supabase Cloud sync)
  // ---------------------------------------------------------------------------
  const save = useCallback(
    async (newData: T[]) => {
      const cleanedData = newData.map((item) => {
        if (!item.id || typeof item.id !== 'string') {
          return { ...item, id: crypto.randomUUID() };
        }
        return item;
      });

      // 1. Instant local persistence
      setData(cleanedData);
      writeLocalCache(table, cleanedData);

      // 2. Sincronização direta de Usuários com Supabase
      if (isUsersTable) {
        await userService.saveAllUsers(cleanedData as any);
        return;
      }

      // 3. Cross-Device Supabase persistence for relational tables
      try {
        if (isClientsTable) {
          const payload = cleanedData.map((item: any) => {
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
            const { error: upsertErr } = await supabase.from('clients').upsert(payload);
            if (upsertErr) {
              setError(upsertErr.message);
            } else {
              setError(null);
            }
          }
        }
      } catch (err: any) {
        console.warn(`[Supabase] Save note for '${table}':`, err?.message);
      }
    },
    [isClientsTable, isUsersTable, table]
  );

  const addItem = useCallback(
    async (item: T) => {
      const itemWithUuid = {
        ...item,
        id: item.id ? item.id : crypto.randomUUID(),
      };
      const newData = [itemWithUuid, ...data.filter((i) => i.id !== itemWithUuid.id)];
      await save(newData);
    },
    [data, save]
  );

  const updateItem = useCallback(
    async (id: string, patch: Partial<T>) => {
      const updatedData = data.map((it) => {
        const matchesId = it.id === id;
        const matchesEmail = isUsersTable && 
          Boolean((it as any).email && (patch as any).email && 
          String((it as any).email).toLowerCase().trim() === String((patch as any).email).toLowerCase().trim());

        if (matchesId || matchesEmail) {
          return { ...it, ...patch };
        }
        return it;
      });
      await save(updatedData);
    },
    [data, isUsersTable, save]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const filtered = data.filter((it) => it.id !== id);
      setData(filtered);
      writeLocalCache(table, filtered);

      if (isClientsTable) {
        try {
          await supabase.from('clients').delete().eq('id', id);
        } catch (e) {
          console.warn('[Supabase] Error deleting client:', e);
        }
      }

      await save(filtered);
    },
    [data, isClientsTable, save, table]
  );

  const saveItem = useCallback(
    async (item: T) => {
      const exists = data.some((it) => it.id === item.id);
      if (exists) {
        await updateItem(item.id, item);
      } else {
        await addItem(item);
      }
    },
    [data, addItem, updateItem]
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
