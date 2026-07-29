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
 * Bulletproof Hybrid Persistence Hook (LocalStorage + Supabase DB)
 * Ensures zero data loss even if Supabase tables haven't been created yet.
 */
export function useLocalStorageState<T extends { id: string }>(
  table: string,
  initialValue: T[] = []
) {
  // Initialize state instantly from LocalStorage cache (or initial mock fallback)
  const [data, setData] = useState<T[]>(() => readLocalCache(table, initialValue));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Sync with Supabase on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: rows, error } = await supabase
          .from('focus_app_state')
          .select('data')
          .eq('table_name', table);

        if (!isMounted) return;

        if (error) {
          console.warn(`[Supabase] Note: Table 'focus_app_state' query warning for '${table}':`, error.message);
          setError(error.message);
          // Keep current LocalStorage/state data - DO NOT wipe out user data on DB warning!
        } else if (rows && rows.length > 0) {
          const items = rows.map((r: any) => r.data as T);
          setData(items);
          writeLocalCache(table, items);
          setError(null);
        } else {
          // If DB is empty for this table name, sync local data to DB if local has items
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
  // CRUD helpers (Instant LocalStorage update + Async Supabase sync)
  // ---------------------------------------------------------------------------
  const save = useCallback(
    async (newData: T[]) => {
      // 1. Instant local persistence
      setData(newData);
      writeLocalCache(table, newData);

      // 2. Async Supabase persistence
      try {
        if (newData.length === 0) {
          const { error } = await supabase
            .from('focus_app_state')
            .delete()
            .eq('table_name', table);
          if (error) setError(error.message);
          return;
        }

        const payload = newData.map((item) => ({
          table_name: table,
          id: String(item.id),
          data: item,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from('focus_app_state')
          .upsert(payload, { onConflict: 'table_name,id' });

        if (error) {
          console.warn(`[Supabase] Save warning for '${table}':`, error.message);
          setError(error.message);
        } else {
          setError(null);
        }
      } catch (err: any) {
        console.warn(`[Supabase] Save exception for '${table}':`, err);
        setError(err?.message || 'Save failed');
      }
    },
    [table]
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
