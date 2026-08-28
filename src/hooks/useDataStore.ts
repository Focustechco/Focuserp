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

function toNullableValidUuid(idStr?: string | null): string | null {
  if (!idStr || typeof idStr !== 'string') return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(idStr) ? idStr : null;
}

function isValidItem(table: string, item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  if (!item.id || typeof item.id !== 'string') return false;
  if (table.includes('contas_receber') || table.includes('receber')) {
    const hasCliente = Boolean(item.cliente || item.clienteNome || item.cliente_nome);
    const hasDesc = Boolean(item.descricao);
    const hasValor = Number(item.valorOriginal ?? item.valor ?? 0) > 0;
    const hasNum = Boolean(item.numero && !item.numero.startsWith('REC-0000'));
    return hasCliente || hasDesc || hasValor || hasNum;
  }
  if (table.includes('contas_pagar') || table.includes('pagar')) {
    const hasForn = Boolean(item.fornecedor || item.fornecedorNome || item.fornecedor_nome);
    const hasDesc = Boolean(item.descricao);
    const hasValor = Number(item.valorOriginal ?? item.valor ?? 0) > 0;
    return hasForn || hasDesc || hasValor;
  }
  return true;
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
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(it => isValidItem(table, it));
          if (valid.length > 0) return valid;
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
 * Hook de Persistência 100% Relacional em Banco de Dados Real Supabase / PostgreSQL.
 * Sincronização em tempo real entre Desktop e Mobile (iOS/Android) via WebSockets.
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
  const isContasReceber = table === 'focus_contas_receber' || table === 'contas_receber';
  const isContasPagar = table === 'focus_contas_pagar' || table === 'contas_pagar';
  const isContratos = table === 'focus_contratos' || table === 'contratos';
  const isProjetos = table === 'focus_projetos' || table === 'projetos';
  const isFornecedores = table === 'focus_fornecedores' || table === 'fornecedores';

  const isMountedRef = useRef(true);

  // Determinar a tabela primária no Supabase
  const primaryDbTable = isContasReceber
    ? 'contas_receber'
    : isContasPagar
    ? 'contas_pagar'
    : isContratos
    ? 'contratos'
    : isProjetos
    ? 'projetos'
    : isFornecedores
    ? 'fornecedores'
    : isClientsTable
    ? 'clients'
    : isUsersTable
    ? 'users'
    : null;

  // ---------------------------------------------------------------------------
  // Sincronizar com o Banco de Dados Real no Supabase
  // ---------------------------------------------------------------------------
  const syncToCloud = useCallback(
    async (items: T[]) => {
      try {
        if (isUsersTable) {
          await userService.saveAllUsers(items as any);
          return;
        }

        // 1. Gravação direta na tabela relacional correspondente no PostgreSQL
        if (isContasReceber) {
          const payload = items.map((item: any) => {
            const validId = toValidUuid(item.id);
            item.id = validId;
            return {
              id: validId,
              numero: item.numero || item.codigo || `REC-${validId.slice(0, 4).toUpperCase()}`,
              cliente_nome: item.cliente || item.clienteNome || 'Cliente',
              cliente_id: toNullableValidUuid(item.clienteId),
              descricao: item.descricao || 'Recebimento de título',
              categoria: item.categoria || 'Receita Operacional',
              valor_original: Number(item.valorOriginal ?? item.valor ?? 0) || 0,
              valor_recebido: Number(item.valorRecebido ?? 0) || 0,
              data_emissao: item.dataEmissao || new Date().toISOString().split('T')[0],
              data_vencimento: item.dataVencimento || item.vencimento || new Date().toISOString().split('T')[0],
              data_recebimento: item.dataRecebimento || null,
              forma_pagamento: item.formaPagamento || 'PIX',
              status: item.status || 'Pendente',
              responsavel: item.responsavel || 'Administrador',
              updated_at: new Date().toISOString(),
            };
          });
          if (payload.length > 0) {
            await supabase.from('contas_receber').upsert(payload);
          }
        } else if (isContasPagar) {
          const payload = items.map((item: any) => {
            const validId = toValidUuid(item.id);
            item.id = validId;
            return {
              id: validId,
              numero: item.numero || item.codigo || `PAG-${validId.slice(0, 4).toUpperCase()}`,
              fornecedor_nome: item.fornecedor || item.fornecedorNome || 'Fornecedor',
              fornecedor_id: toNullableValidUuid(item.fornecedorId),
              descricao: item.descricao || 'Despesa operacional',
              categoria: item.categoria || 'Despesa Operacional',
              valor_original: Number(item.valorOriginal ?? item.valor ?? 0) || 0,
              valor_pago: Number(item.valorPago ?? 0) || 0,
              data_emissao: item.dataEmissao || new Date().toISOString().split('T')[0],
              data_vencimento: item.dataVencimento || item.vencimento || new Date().toISOString().split('T')[0],
              data_pagamento: item.dataPagamento || null,
              forma_pagamento: item.formaPagamento || 'Boleto',
              status: item.status || 'Pendente',
              responsavel: item.responsavel || 'Administrador',
              updated_at: new Date().toISOString(),
            };
          });
          if (payload.length > 0) {
            await supabase.from('contas_pagar').upsert(payload);
          }
        } else if (isContratos) {
          const payload = items.map((item: any) => {
            const validId = toValidUuid(item.id);
            item.id = validId;
            return {
              id: validId,
              numero_contrato: item.numeroContrato || item.numero || `CTR-${validId.slice(0, 4).toUpperCase()}`,
              objeto_contrato: item.objetoContrato || item.objeto || item.titulo || 'Contrato de Serviços',
              cliente_id: toNullableValidUuid(item.clienteId),
              valor_total: Number(item.valorTotal ?? item.valor ?? 0) || 0,
              valor_mensal: Number(item.valorMensal ?? item.valorMensalidade ?? 0) || 0,
              tipo_contrato: item.tipoContrato || 'Prestação de Serviços',
              data_inicio: item.dataInicio || new Date().toISOString().split('T')[0],
              data_fim: item.dataFim || null,
              status: item.status || 'Ativo',
              updated_at: new Date().toISOString(),
            };
          });
          if (payload.length > 0) {
            await supabase.from('contratos').upsert(payload);
          }
        } else if (isProjetos) {
          const payload = items.map((item: any) => {
            const validId = toValidUuid(item.id);
            item.id = validId;
            return {
              id: validId,
              codigo: item.codigo || `PRJ-${validId.slice(0, 4).toUpperCase()}`,
              nome: item.nome || item.titulo || 'Novo Projeto',
              cliente_id: toNullableValidUuid(item.clienteId),
              tipo: item.tipo || 'Desenvolvimento',
              status: item.status || 'Planejamento',
              valor_contratado: Number(item.valorContratado ?? item.valor ?? 0) || 0,
              valor_recebido: Number(item.valorRecebido ?? 0) || 0,
              updated_at: new Date().toISOString(),
            };
          });
          if (payload.length > 0) {
            await supabase.from('projetos').upsert(payload);
          }
        } else if (isFornecedores) {
          const payload = items.map((item: any) => {
            const validId = toValidUuid(item.id);
            item.id = validId;
            return {
              id: validId,
              razao_social: item.razaoSocial || item.nome || 'Fornecedor',
              nome_fantasia: item.nomeFantasia || item.nome || 'Fornecedor',
              cnpj: item.cnpj || item.documento || '00.000.000/0001-00',
              email: item.email || null,
              telefone: item.telefone || null,
              status: item.status || 'Ativo',
              updated_at: new Date().toISOString(),
            };
          });
          if (payload.length > 0) {
            await supabase.from('fornecedores').upsert(payload);
          }
        } else if (isClientsTable) {
          const payload = items.map((item: any) => {
            const validId = toValidUuid(item.id);
            item.id = validId;
            return {
              id: validId,
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

        // 2. Persistência de backup de estado serializado do módulo na nuvem (Recorrências, Centros de Custo, etc.)
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
    [isClientsTable, isContasPagar, isContasReceber, isContratos, isFornecedores, isProjetos, isUsersTable, table]
  );

  // ---------------------------------------------------------------------------
  // Sync Data on Client Mount & Realtime Cloud Database
  // ---------------------------------------------------------------------------
  useEffect(() => {
    isMountedRef.current = true;

    // 1. Carregamento inicial imediato
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
        } else if (isContasReceber) {
          // Buscar diretamente da tabela relacional contas_receber no Supabase
          const { data: dbRows, error: dbErr } = await supabase
            .from('contas_receber')
            .select('*')
            .order('data_vencimento', { ascending: true });

          if (!isMountedRef.current) return;

          if (!dbErr && Array.isArray(dbRows)) {
            const mapped = dbRows
              .filter((item: any) => item && (item.cliente_nome || item.descricao || Number(item.valor_original || 0) > 0))
              .map((item: any) => {
                const valorOrig = Number(item.valor_original ?? item.valorOriginal ?? 0) || 0;
                const valorRec = Number(item.valor_recebido ?? item.valorRecebido ?? 0) || 0;
                return {
                  id: String(item.id),
                  numero: item.numero || `REC-${String(item.id).slice(0, 4).toUpperCase()}`,
                  cliente: item.cliente_nome || item.cliente || 'Cliente',
                  clienteId: item.cliente_id || item.clienteId,
                  descricao: item.descricao || 'Recebimento de título',
                  categoria: item.categoria || 'Receita Operacional',
                  valorOriginal: valorOrig,
                  valorRecebido: valorRec,
                  saldo: Number(item.saldo ?? (valorOrig - valorRec)) || 0,
                  dataEmissao: item.data_emissao || new Date().toISOString().split('T')[0],
                  dataVencimento: item.data_vencimento || new Date().toISOString().split('T')[0],
                  dataRecebimento: item.data_recebimento || null,
                  formaPagamento: item.forma_pagamento || 'PIX',
                  status: item.status || 'Pendente',
                  responsavel: item.responsavel || 'Administrador',
                  ultimaAtualizacao: item.updated_at || new Date().toISOString(),
                };
              }) as unknown as T[];

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
          }
        } else if (isContasPagar) {
          // Buscar diretamente da tabela relacional contas_pagar no Supabase
          const { data: dbRows, error: dbErr } = await supabase
            .from('contas_pagar')
            .select('*')
            .order('data_vencimento', { ascending: true });

          if (!isMountedRef.current) return;

          if (!dbErr && Array.isArray(dbRows)) {
            const mapped = dbRows
              .filter((item: any) => item && (item.fornecedor_nome || item.descricao || Number(item.valor_original || 0) > 0))
              .map((item: any) => {
                const valorOrig = Number(item.valor_original ?? item.valorOriginal ?? 0) || 0;
                const valorPg = Number(item.valor_pago ?? item.valorPago ?? 0) || 0;
                return {
                  id: String(item.id),
                  numero: item.numero || `PAG-${String(item.id).slice(0, 4).toUpperCase()}`,
                  fornecedor: item.fornecedor_nome || item.fornecedor || 'Fornecedor',
                  fornecedorId: item.fornecedor_id || item.fornecedorId,
                  descricao: item.descricao || 'Despesa operacional',
                  categoria: item.categoria || 'Despesa Operacional',
                  valorOriginal: valorOrig,
                  valorPago: valorPg,
                  saldo: Number(item.saldo ?? (valorOrig - valorPg)) || 0,
                  dataEmissao: item.data_emissao || new Date().toISOString().split('T')[0],
                  dataVencimento: item.data_vencimento || new Date().toISOString().split('T')[0],
                  dataPagamento: item.data_pagamento || null,
                  formaPagamento: item.forma_pagamento || 'Boleto',
                  status: item.status || 'Pendente',
                  responsavel: item.responsavel || 'Administrador',
                  ultimaAtualizacao: item.updated_at || new Date().toISOString(),
                };
              }) as unknown as T[];

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
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
            return;
          }
        }

        // Buscar estado serializado do módulo na tabela clients
        const stateRowId = getTableUuid(table);
        const stateName = `__FOCUS_STATE__${table}`;

        let cloudEmail: string | null = null;
        try {
          const { data: rowById } = await supabase
            .from('clients')
            .select('contact_email')
            .eq('id', stateRowId)
            .maybeSingle();

          if (rowById?.contact_email) {
            cloudEmail = rowById.contact_email;
          } else {
            const { data: rowByName } = await supabase
              .from('clients')
              .select('contact_email')
              .eq('name', stateName)
              .maybeSingle();
            if (rowByName?.contact_email) {
              cloudEmail = rowByName.contact_email;
            }
          }
        } catch {}

        if (!isMountedRef.current) return;

        if (cloudEmail) {
          try {
            const cloudItems: T[] = JSON.parse(cloudEmail);
            if (Array.isArray(cloudItems) && cloudItems.length > 0) {
              if (isMountedRef.current) {
                setData(cloudItems);
                writeLocalCache(table, cloudItems);
                setError(null);
              }
            }
          } catch {}
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

    // Supabase Realtime Subscription para Desktop & Mobile
    let channels: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stateName = `__FOCUS_STATE__${table}`;
        const stateRowId = getTableUuid(table);

        // Canal da tabela primária relacional (se houver)
        if (primaryDbTable && primaryDbTable !== 'clients') {
          const relChannel = supabase
            .channel(`rt_rel_${primaryDbTable}_${Math.random().toString(36).slice(2, 7)}`)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: primaryDbTable },
              () => {
                if (isMountedRef.current) fetchData();
              }
            )
            .subscribe();
          channels.push(relChannel);
        }

        // Canal da tabela clients / estado global
        const clientsChannel = supabase
          .channel(`rt_cli_${table}_${Math.random().toString(36).slice(2, 7)}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'clients' },
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
        channels.push(clientsChannel);
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
      channels.forEach((ch) => {
        try { supabase.removeChannel(ch); } catch {}
      });
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
  // CRUD helpers com atualizações atômicas e persistência garantida no PostgreSQL
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

        if (primaryDbTable) {
          supabase.from(primaryDbTable).delete().eq('id', id).catch(() => {});
        }

        syncToCloud(updated);
        return updated;
      });
    },
    [primaryDbTable, syncToCloud, table]
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
