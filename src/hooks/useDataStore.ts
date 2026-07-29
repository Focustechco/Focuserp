import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Helper to generate a valid, deterministic UUID for state storage keys.
 */
function getTableUuid(table: string): string {
  // Convert table string to a 12-char hex string
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
    const raw = window.localStorage.getItem(`focus_app_${table}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn(`[LocalStorage] Error reading key focus_app_${table}:`, e);
  }
  return fallback;
}

/**
 * Helper to safely write to localStorage
 */
function writeLocalCache<T>(table: string, items: T[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`focus_app_${table}`, JSON.stringify(items));
  } catch (e) {
    console.warn(`[LocalStorage] Error writing key focus_app_${table}:`, e);
  }
}

/**
 * Bulletproof Multi-Device Storage Hook (Real-Time Cloud Persistence for ALL Modules & Notifications)
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
  const stateUuid = getTableUuid(table);

  // ---------------------------------------------------------------------------
  // Real-Time Cross-Device Cloud Sync (Mobile iOS/Android <-> Desktop)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        if (isClientsTable) {
          // Fetch real client rows (filtering out internal state rows)
          const { data: dbClients, error: dbErr } = await supabase
            .from('clients')
            .select('*')
            .not('name', 'like', '__FOCUS_STATE__%')
            .order('created_at', { ascending: false });

          if (!isMounted) return;

          if (!dbErr && dbClients && dbClients.length > 0) {
            const mapped = dbClients.map((c: any) => ({
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

            const localOnly = readLocalCache(table, []).filter(
              (l) => !mapped.some((m) => m.id === l.id)
            );
            const combined = [...mapped, ...localOnly];

            setData(combined);
            writeLocalCache(table, combined);
            setError(null);
            return;
          }
        } else {
          // Fetch general module state row (Notifications, Projects, Tasks, Contracts, Financials)
          const { data: stateRows, error: stateErr } = await supabase
            .from('clients')
            .select('contact_email')
            .eq('id', stateUuid)
            .single();

          if (!isMounted) return;

          if (!stateErr && stateRows?.contact_email) {
            try {
              const parsed = JSON.parse(stateRows.contact_email);
              if (Array.isArray(parsed)) {
                setData(parsed);
                writeLocalCache(table, parsed);
                setError(null);
                return;
              }
            } catch (pErr) {
              console.warn(`[Supabase] JSON parse warning for '${table}':`, pErr);
            }
          }

          // Fallback query to focus_app_state
          const { data: rows, error: fallbackErr } = await supabase
            .from('focus_app_state')
            .select('data')
            .eq('table_name', table);

          if (!isMounted) return;

          if (!fallbackErr && rows && rows.length > 0) {
            const items = rows.map((r: any) => r.data as T);
            setData(items);
            writeLocalCache(table, items);
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

    // 5-second automatic cross-device polling (Mobile iOS / Android <-> Desktop)
    const intervalId = setInterval(() => {
      if (isMounted) {
        fetchData();
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
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

      // 2. Cross-Device Supabase persistence
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

          const { error: upsertErr } = await supabase.from('clients').upsert(payload);
          if (upsertErr) {
            setError(upsertErr.message);
          } else {
            setError(null);
          }
        } else {
          // Persist module state row (Notifications, Tasks, Projects, Contracts) into Supabase Cloud
          const statePayload = {
            id: stateUuid,
            name: `__FOCUS_STATE__${table}`,
            status: 'inativo',
            contact_email: JSON.stringify(cleanedData),
            updated_at: new Date().toISOString(),
          };

          const { error: cloudErr } = await supabase.from('clients').upsert(statePayload);

          if (cloudErr) {
            console.warn(`[Supabase] Cloud save warning for '${table}':`, cloudErr.message);
            setError(cloudErr.message);
          } else {
            setError(null);
          }

          // Redundant backup to focus_app_state if table exists
          if (cleanedData.length > 0) {
            const payload = cleanedData.map((item) => ({
              table_name: table,
              id: String(item.id),
              data: item,
              updated_at: new Date().toISOString(),
            }));
            await supabase.from('focus_app_state').upsert(payload, { onConflict: 'table_name,id' }).catch(() => {});
          }
        }
      } catch (err: any) {
        console.warn(`[Supabase] Save exception for '${table}':`, err);
        setError(err?.message || 'Save failed');
      }
    },
    [isClientsTable, stateUuid, table]
  );

  const addItem = useCallback(
    async (item: T) => {
      const itemWithUuid = {
        ...item,
        id: toValidUuid(item.id),
      };
      const newData = [itemWithUuid, ...data.filter((i) => i.id !== itemWithUuid.id)];
      await save(newData);
    },
    [data, save]
  );

  const updateItem = useCallback(
    async (id: string, patch: Partial<T>) => {
      const updatedData = data.map((it) => {
        if (it.id === id) {
          return { ...it, ...patch };
        }
        return it;
      });
      await save(updatedData);
    },
    [data, save]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const filtered = data.filter((it) => it.id !== id);
      await save(filtered);
    },
    [data, save]
  );

  const removeItem = deleteItem;
  const setAllItems = save;

  return {
    data,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    removeItem,
    save,
    setAllItems,
  };
}
