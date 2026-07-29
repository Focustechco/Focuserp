import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

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
 * Bulletproof Multi-Device Storage Hook (Direct Supabase Tables + Focus App State Fallback)
 * Syncs seamlessly across Desktop, iOS, and Android mobile browsers via Supabase.
 */
export function useLocalStorageState<T extends { id: string }>(
  table: string,
  initialValue: T[] = []
) {
  // Initialize state instantly from LocalStorage cache (or initial mock fallback)
  const [data, setData] = useState<T[]>(() => readLocalCache(table, initialValue));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isClientsTable = table === 'clients' || table === 'clientes';

  // ---------------------------------------------------------------------------
  // Sync with Supabase across all devices (Mobile iOS/Android & Desktop)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        if (isClientsTable) {
          // Direct sync with Supabase `clients` table
          const { data: dbClients, error: dbErr } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

          if (!isMounted) return;

          if (!dbErr && dbClients && dbClients.length > 0) {
            const mapped = dbClients.map((c: any) => ({
              id: c.id,
              nome: c.name || c.nome || 'Cliente sem nome',
              name: c.name || c.nome || 'Cliente sem nome',
              email: c.contact_email || c.email || '',
              contact_email: c.contact_email || c.email || '',
              telefone: c.contact_phone || c.telefone || '',
              contact_phone: c.contact_phone || c.telefone || '',
              status: c.status || 'ativo',
              created_at: c.created_at || new Date().toISOString(),
              updated_at: c.updated_at || new Date().toISOString(),
              ...c,
            })) as T[];

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
          }
        }

        // Standard single-table JSONB storage (`focus_app_state`)
        const { data: rows, error: stateErr } = await supabase
          .from('focus_app_state')
          .select('data')
          .eq('table_name', table);

        if (!isMounted) return;

        if (stateErr) {
          console.warn(`[Supabase] Query warning for '${table}':`, stateErr.message);
          setError(stateErr.message);
        } else if (rows && rows.length > 0) {
          const items = rows.map((r: any) => r.data as T);
          setData(items);
          writeLocalCache(table, items);
          setError(null);
        } else {
          // Sync local items to Supabase if DB row is empty
          const currentLocal = readLocalCache(table, initialValue);
          if (currentLocal && currentLocal.length > 0) {
            const payload = currentLocal.map((item) => ({
              table_name: table,
              id: String(item.id),
              data: item,
              updated_at: new Date().toISOString(),
            }));
            await supabase.from('focus_app_state').upsert(payload, { onConflict: 'table_name,id' });
          }
          setError(null);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.warn(`[Supabase] Fetch exception for '${table}':`, err);
        setError(err?.message || 'Unknown fetch error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  // ---------------------------------------------------------------------------
  // CRUD helpers (Instant LocalStorage update + Supabase Cloud sync)
  // ---------------------------------------------------------------------------
  const save = useCallback(
    async (newData: T[]) => {
      // 1. Instant local persistence
      setData(newData);
      writeLocalCache(table, newData);

      // 2. Cross-Device Supabase persistence
      try {
        if (isClientsTable) {
          // Sync to `clients` table directly
          const payload = newData.map((item: any) => ({
            id: String(item.id).includes('-') ? item.id : undefined,
            name: item.nome || item.name || 'Novo Cliente',
            status: item.status || 'ativo',
            contact_email: item.email || item.contact_email || null,
            contact_phone: item.telefone || item.contact_phone || null,
            updated_at: new Date().toISOString(),
          }));

          const { error: upsertErr } = await supabase.from('clients').upsert(payload);
          if (upsertErr) {
            console.warn(`[Supabase] Clients table sync warning:`, upsertErr.message);
          } else {
            setError(null);
          }
        }

        // Sync to `focus_app_state` table
        if (newData.length > 0) {
          const payload = newData.map((item) => ({
            table_name: table,
            id: String(item.id),
            data: item,
            updated_at: new Date().toISOString(),
          }));

          const { error: stateErr } = await supabase
            .from('focus_app_state')
            .upsert(payload, { onConflict: 'table_name,id' });

          if (stateErr) {
            console.warn(`[Supabase] Save warning for '${table}':`, stateErr.message);
            setError(stateErr.message);
          } else {
            setError(null);
          }
        }
      } catch (err: any) {
        console.warn(`[Supabase] Save exception for '${table}':`, err);
        setError(err?.message || 'Save failed');
      }
    },
    [isClientsTable, table]
  );

  const addItem = useCallback(
    async (item: T) => {
      const newData = [item, ...data.filter((i) => i.id !== item.id)];
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
