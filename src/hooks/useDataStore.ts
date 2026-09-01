import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeSetItem, safeGetItem, safeRemoveItem } from '@/lib/safeStorage';
import { userService } from '@/services/userService';

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

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  items.forEach((item) => {
    if (item && item.id) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}

const DMS_FOLDER_NAMES = [
  'Clientes',
  'Projetos',
  'RH',
  'Colaboradores',
  'Folha de Pagamento',
  'Contratos de Trabalho',
  'Atestados e Licenças',
  'Produtos Focus',
  'Manuais e Guias',
];

function isDmsFolderObject(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  // Categorias do Plano de Contas e Centros de Custo nunca são pastas do DMS
  if (
    item.codigo !== undefined || 
    item.natureza !== undefined || 
    item.tipo === 'Despesa' || 
    item.tipo === 'Receita' || 
    item.saldoAcumuladoMensal !== undefined || 
    item.departamento !== undefined ||
    item.responsavel !== undefined
  ) {
    return false;
  }
  if (item.caminhoCompleto || item.moduloVinculado) return true;
  if (item.nome && DMS_FOLDER_NAMES.includes(item.nome) && !item.codigo && !item.tipo && !item.clienteId && !item.valorContratado && !item.numeroContrato) {
    return true;
  }
  return false;
}

function isValidItem(table: string, item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  if (!item.id || typeof item.id !== 'string') return false;

  // Rejeitar pastas do DMS injetadas por colisão em outros módulos
  if (table !== 'focus_dms_pastas' && isDmsFolderObject(item)) {
    return false;
  }

  // Profile rows de usuário pertencem ao userService e não devem aparecer em outras tabelas
  if (!table.includes('usuario') && !table.includes('user') && item.name && typeof item.name === 'string' && item.name.startsWith('__USER_PROFILE__')) {
    return false;
  }

  if (table.includes('plano_contas') || table.includes('categorias')) {
    return Boolean(item.nome && typeof item.nome === 'string' && item.nome.trim().length > 0);
  }
  if (table.includes('centro_custos') || table.includes('centro-de-custos')) {
    return Boolean(item.nome && typeof item.nome === 'string' && item.nome.trim().length > 0);
  }

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
  if (table.includes('fornecedores')) {
    const name = item.nomeFantasia || item.razaoSocial || item.name || item.nome;
    return Boolean(name && name.trim() !== '' && name !== 'Fornecedor Sem Nome');
  }
  if (table.includes('contratos')) {
    const hasContractData = Boolean(item.numeroContrato || item.objetoContrato || item.objeto || item.valorTotal || item.valorMensalidade || item.tipoContrato);
    if (!hasContractData && !item.nome) return false;
    if (DMS_FOLDER_NAMES.includes(item.nome)) return false;
    return true;
  }
  if (table.includes('projetos')) {
    if (DMS_FOLDER_NAMES.includes(item.nome) && !item.clienteId && !item.valorContratado) return false;
    return Boolean(item.nome && typeof item.nome === 'string' && item.nome.trim().length > 0);
  }
  if (table.includes('produtos')) {
    if (DMS_FOLDER_NAMES.includes(item.nome) && !item.preco && !item.categoria) return false;
    return Boolean((item.nome || item.name) && typeof (item.nome || item.name) === 'string');
  }
  if (table.includes('notificacoes')) {
    return Boolean(item.titulo && typeof item.titulo === 'string' && item.titulo.trim().length > 0);
  }
  if (table.includes('cobrancas') || table.includes('cobranca')) {
    return Boolean(item.id && (item.cliente || item.valor !== undefined || item.tituloReferencia));
  }

  // Expurgar dados mockados residuais antigos em RH, Comercial e Assinaturas
  const LEGACY_MOCK_IDS = [
    'fer-1', 'fer-2', 'fer-3',
    'ben-1', 'ben-2', 'ben-3',
    'ciclo-1', 'ciclo-2',
    'doc-rh-1', 'doc-rh-2',
    'onb-1', 'onb-2', 'onb-3',
    'ponto-1', 'ponto-2', 'ponto-3',
    'treina-1', 'treina-2',
    'colab-1', 'colab-2', 'colab-3', 'colab-101', 'colab-102', 'colab-103', 'colab-104', 'colab-105', 'colab-106',
    'doc-sign-1', 'doc-sign-2', 'doc-sign-3',
    'mod-1', 'mod-2', 'mod-3',
    'cert-1', 'cert-2',
    'eq-1', 'eq-2', 'eq-3', 'eq-4',
    'meta-1', 'meta-2', 'meta-3',
    'okr-1', 'okr-2',
    'prod-1', 'prod-2',
    'serv-1',
    'tab-1', 'tab-2',
    'prop-1', 'prop-2',
    'sc-1', 'sc-2',
    'est-1', 'est-2',
    'pb-1', 'pb-2',
    'atv-1', 'atv-2', 'atv-3',
    'ag-1', 'ag-2', 'ag-3',
    'rc-1', 'rc-2',
    'reg-com-1', 'reg-com-2'
  ];

  if (item.id && LEGACY_MOCK_IDS.includes(item.id)) {
    return false;
  }

  // Verificar nomes de colaboradores mockados específicos do RH
  if (table.startsWith('focus_rh_') || table.includes('ferias') || table.includes('colaborador')) {
    const nomeColab = item.colaboradorNome || item.colaborador || item.nomeCompleto || item.nome || '';
    if (['Mariana Souza', 'Lucas Rodrigues', 'Carlos Eduardo Oliveira', 'TechCorp'].includes(nomeColab)) {
      return false;
    }
  }

  return true;
}

/**
 * Helper to safely read from localStorage and auto-heal contaminated cache
 */
function readLocalCache<T>(table: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const keysToTry = [`focus_app_${table}`, table, `focus_${table}`];
    for (const k of keysToTry) {
      const raw = safeGetItem(k);
      if (raw !== null && raw !== undefined) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Auto-heal: se o cache foi contaminado por pastas do DMS, expurgar a chave
          if (table !== 'focus_dms_pastas' && parsed.some(isDmsFolderObject)) {
            safeRemoveItem(k);
            continue;
          }

          const valid = parsed.filter(it => isValidItem(table, it));
          return valid;
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
 * Hook de Persistência 100% Relacional com Isolamento Estrito de Tabelas no Supabase / PostgreSQL.
 * Sincronização em tempo real entre Desktop e Mobile (iOS/Android).
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
  const isColaboradores = table === 'focus_colaboradores' || table === 'colaboradores' || table === 'focus_rh_colaboradores';

  const isMountedRef = useRef(true);

  // Determinar a tabela primária real no PostgreSQL do Supabase
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
    : isColaboradores
    ? 'colaboradores'
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

        // 1. Gravação direta e isolada na tabela relacional correspondente no PostgreSQL
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
          const dedupedPayload = deduplicateById(payload);
          if (dedupedPayload.length > 0) {
            const { error: upsertErr } = await supabase.from('contas_receber').upsert(dedupedPayload, { onConflict: 'id' });
            if (upsertErr) {
              const safePayload = dedupedPayload.map(p => ({ ...p, cliente_id: null }));
              await supabase.from('contas_receber').upsert(safePayload, { onConflict: 'id' });
            }
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
          const dedupedPayload = deduplicateById(payload);
          if (dedupedPayload.length > 0) {
            const { error: upsertErr } = await supabase.from('contas_pagar').upsert(dedupedPayload, { onConflict: 'id' });
            if (upsertErr) {
              const safePayload = dedupedPayload.map(p => ({ ...p, fornecedor_id: null }));
              await supabase.from('contas_pagar').upsert(safePayload, { onConflict: 'id' });
            }
          }
        } else if (isContratos) {
          const payload = items.map((item: any) => {
            const validId = toValidUuid(item.id);
            item.id = validId;
            return {
              id: validId,
              numero_contrato: item.numeroContrato || item.numero || `CTR-${validId.slice(0, 4).toUpperCase()}`,
              cliente_id: toNullableValidUuid(item.clienteId),
              objeto_contrato: item.objetoContrato || item.nome || 'Prestação de Serviços',
              tipo_contrato: item.tipoContrato || 'Recorrente',
              valor_total: Number(item.valorTotal ?? item.valor ?? 0) || 0,
              data_inicio: item.dataInicio || new Date().toISOString().split('T')[0],
              data_fim: item.dataFim || null,
              status: item.status || 'Ativo',
              updated_at: new Date().toISOString(),
            };
          });
          const dedupedPayload = deduplicateById(payload);
          if (dedupedPayload.length > 0) {
            const { error: upsertErr } = await supabase.from('contratos').upsert(dedupedPayload, { onConflict: 'id' });
            if (upsertErr) {
              const safePayload = dedupedPayload.map(p => ({ ...p, cliente_id: null }));
              await supabase.from('contratos').upsert(safePayload, { onConflict: 'id' });
            }
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
              categoria: item.categoria || 'Geral',
              prioridade: item.prioridade || 'Média',
              status: item.status || 'Planejamento',
              valor_recebido: Number(item.valorRecebido ?? item.valorContratado ?? item.valor ?? 0) || 0,
              data_inicio: item.dataInicio || new Date().toISOString().split('T')[0],
              descricao: item.descricao || item.descricaoGeral || '',
              updated_at: new Date().toISOString(),
            };
          });
          const dedupedPayload = deduplicateById(payload);
          if (dedupedPayload.length > 0) {
            const { error: upsertErr } = await supabase.from('projetos').upsert(dedupedPayload, { onConflict: 'id' });
            if (upsertErr) {
              const safePayload = dedupedPayload.map(p => ({ ...p, cliente_id: null }));
              await supabase.from('projetos').upsert(safePayload, { onConflict: 'id' });
            }
          }
        } else if (isFornecedores) {
          const payload = items.map((item: any) => {
            const validId = toValidUuid(item.id);
            item.id = validId;
            return {
              id: validId,
              razao_social: item.razaoSocial || item.nome || 'Fornecedor',
              nome_fantasia: item.nomeFantasia || item.razaoSocial || item.nome || 'Fornecedor',
              codigo: item.codigo || `FOR-${validId.slice(0, 4).toUpperCase()}`,
              cnpj: item.cnpj || item.documento || '00.000.000/0001-00',
              email: item.email || item.contatos?.[0]?.email || null,
              telefone: item.telefone || item.contatos?.[0]?.celular || null,
              categoria: item.categoria || 'Geral',
              status: item.status === 'Inativo' ? 'Inativo' : 'Ativo',
              updated_at: new Date().toISOString(),
            };
          });
          const dedupedPayload = deduplicateById(payload);
          if (dedupedPayload.length > 0) {
            await supabase.from('fornecedores').upsert(dedupedPayload, { onConflict: 'id' });
          }
        } else if (isColaboradores) {
          const payload = items.map((item: any) => {
            const validId = toValidUuid(item.id);
            item.id = validId;
            return {
              id: validId,
              matricula: item.matricula || `COL-${validId.slice(0, 4).toUpperCase()}`,
              nome: item.nome || item.nomeCompleto || item.name || 'Colaborador',
              cargo: item.cargo || 'Especialista',
              departamento: item.departamento || 'Geral',
              email: item.email || item.emailCorporativo || null,
              cpf: item.cpf || item.documento || null,
              tipo_contrato: item.tipoContrato || item.tipo_contrato || 'CLT',
              status: item.status || 'Ativo',
              data_admissao: item.dataAdmissao || item.data_admissao || new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString(),
            };
          });
          const dedupedPayload = deduplicateById(payload);
          if (dedupedPayload.length > 0) {
            await supabase.from('colaboradores').upsert(dedupedPayload, { onConflict: 'id' });
          }
        } else if (isClientsTable) {
          const payloadClients = items.map((item: any) => {
            const validId = toValidUuid(item.id);
            item.id = validId;
            return {
              id: validId,
              name: item.nomeFantasia || item.razaoSocial || item.name || 'Novo Cliente',
              status: String(item.status || 'ativo').toLowerCase() === 'inativo' ? 'inativo' : 'ativo',
              contact_email: item.contatos?.[0]?.email || item.email || item.contact_email || null,
              contact_phone: item.contatos?.[0]?.celular || item.telefone || item.contact_phone || null,
              updated_at: new Date().toISOString(),
            };
          });
          const payloadClientes = items.map((item: any) => {
            const validId = toValidUuid(item.id);
            const end = item.endereco || {};
            return {
              id: validId,
              codigo: item.codigo || `CLI-${validId.slice(0, 4).toUpperCase()}`,
              razao_social: item.razaoSocial || item.nomeFantasia || item.name || 'Cliente',
              nome_fantasia: item.nomeFantasia || item.razaoSocial || item.name || 'Cliente',
              documento: item.documento || item.cnpj || item.cpf || '00.000.000/0001-00',
              inscricao_estadual: item.inscricaoEstadual || item.inscricao_estadual || 'Isento',
              tipo: item.tipo || 'Pessoa Jurídica',
              status: String(item.status || 'Ativo') === 'Inativo' ? 'Inativo' : 'Ativo',
              segmento: item.segmento || 'Geral',
              cep: end.cep || item.cep || null,
              logradouro: end.logradouro || item.logradouro || null,
              numero: end.numero || item.numero || null,
              bairro: end.bairro || item.bairro || null,
              cidade: end.cidade || item.cidade || null,
              estado: end.estado || item.estado || null,
              updated_at: new Date().toISOString(),
            };
          });
          const dedupedClients = deduplicateById(payloadClients);
          const dedupedClientes = deduplicateById(payloadClientes);
          if (dedupedClients.length > 0) {
            await supabase.from('clients').upsert(dedupedClients, { onConflict: 'id' });
          }
          if (dedupedClientes.length > 0) {
            await supabase.from('clientes').upsert(dedupedClientes, { onConflict: 'id' });
          }
        }
      } catch (err: any) {
        console.warn(`[Supabase] Erro ao sincronizar '${table}' com o banco de dados:`, err?.message);
      }
    },
    [isClientsTable, isColaboradores, isContasPagar, isContasReceber, isContratos, isFornecedores, isProjetos, isUsersTable, table]
  );

  // ---------------------------------------------------------------------------
  // Sync Data on Client Mount & Realtime Cloud Database
  // ---------------------------------------------------------------------------
  useEffect(() => {
    isMountedRef.current = true;

    // 1. Carregamento inicial imediato com dados limpos
    const localCached = readLocalCache(table, initialValue);
    if (isMountedRef.current && localCached.length > 0) {
      setData(localCached);
    }

    const fetchData = async () => {
      try {
        if (isUsersTable) {
          const dbUsers = await userService.getUsers();
          if (isMountedRef.current && Array.isArray(dbUsers)) {
            setData(dbUsers as unknown as T[]);
            writeLocalCache(table, dbUsers);
            setError(null);
          }
          return;
        }

        if (isContasReceber) {
          const { data: dbRows, error: dbErr } = await supabase
            .from('contas_receber')
            .select('*')
            .order('data_vencimento', { ascending: true });

          if (!isMountedRef.current) return;

          if (!dbErr && Array.isArray(dbRows)) {
            const rawDeletedIds = safeGetItem('focus_app_deleted_contas_receber_ids');
            const deletedSet = new Set<string>(rawDeletedIds ? JSON.parse(rawDeletedIds) : []);

            const mapped = dbRows
              .filter((item: any) => item && !deletedSet.has(String(item.id)) && (item.cliente_nome || item.cliente || item.descricao || Number(item.valor_original || 0) > 0))
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
                  centroCustoNome: item.centro_custo || item.centroCustoNome || item.centroCusto || '',
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

            localCached.forEach((lc: any) => {
              if (lc && lc.id && !mapped.some((m: any) => m.id === lc.id) && !deletedSet.has(String(lc.id))) {
                mapped.push(lc);
              }
            });

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
          }
        }

        if (isContasPagar) {
          const { data: dbRows, error: dbErr } = await supabase
            .from('contas_pagar')
            .select('*')
            .order('data_vencimento', { ascending: true });

          if (!isMountedRef.current) return;

          if (!dbErr && Array.isArray(dbRows)) {
            const rawDeletedIds = safeGetItem('focus_app_deleted_contas_pagar_ids');
            const deletedSet = new Set<string>(rawDeletedIds ? JSON.parse(rawDeletedIds) : []);

            const mapped = dbRows
              .filter((item: any) => item && !deletedSet.has(String(item.id)) && (item.fornecedor_nome || item.fornecedor || item.descricao || Number(item.valor_original || 0) > 0))
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
                  centroCustoNome: item.centro_custo || item.centroCustoNome || item.centroCusto || '',
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

            localCached.forEach((lc: any) => {
              if (lc && lc.id && !mapped.some((m: any) => m.id === lc.id) && !deletedSet.has(String(lc.id))) {
                mapped.push(lc);
              }
            });

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
          }
        }

        if (isContratos) {
          const { data: dbRows, error: dbErr } = await supabase
            .from('contratos')
            .select('*')
            .order('created_at', { ascending: false });

          if (!isMountedRef.current) return;

          if (!dbErr && Array.isArray(dbRows)) {
            const mapped = dbRows
              .filter((item: any) => item && (item.numero_contrato || item.objeto_contrato || item.nome) && !isDmsFolderObject(item))
              .map((item: any) => ({
                id: String(item.id),
                numeroContrato: item.numero_contrato || item.numeroContrato || `CTR-${String(item.id).slice(0, 4).toUpperCase()}`,
                nome: item.objeto_contrato || item.nome || 'Contrato de Prestação de Serviços',
                clienteId: item.cliente_id || item.clienteId,
                clienteNome: item.cliente_nome || item.clienteNome || 'Cliente Focus',
                objetoContrato: item.objeto_contrato || item.objetoContrato || 'Serviços de Tecnologia',
                tipoContrato: item.tipo_contrato || item.tipoContrato || 'Recorrente',
                valorTotal: Number(item.valor_total ?? item.valorTotal ?? 0) || 0,
                valorMensalidade: Number(item.valor_mensalidade ?? item.valorMensalidade ?? 0) || 0,
                dataInicio: item.data_inicio || item.dataInicio || new Date().toISOString().split('T')[0],
                dataFim: item.data_fim || item.dataFim || null,
                status: item.status || 'Ativo',
                vigenciaIndeterminada: item.vigencia_indeterminada ?? true,
                createdAt: item.created_at || new Date().toISOString(),
              })) as unknown as T[];

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
          }
        }

        if (isProjetos) {
          const { data: dbRows, error: dbErr } = await supabase
            .from('projetos')
            .select('*')
            .order('created_at', { ascending: false });

          if (!isMountedRef.current) return;

          if (!dbErr && Array.isArray(dbRows)) {
            const mapped = dbRows
              .filter((item: any) => item && item.nome && !isDmsFolderObject(item))
              .map((item: any) => ({
                id: String(item.id),
                codigo: item.codigo || `PRJ-${String(item.id).slice(0, 4).toUpperCase()}`,
                nome: item.nome || 'Projeto',
                clienteId: item.cliente_id || item.clienteId,
                cliente: item.cliente || 'Cliente Focus',
                tipo: item.tipo || 'Desenvolvimento',
                status: item.status || 'Planejamento',
                progresso: Number(item.progresso ?? item.progresso_estimado ?? 0) || 0,
                responsavel: item.responsavel || 'Tech Lead',
                valorContratado: Number(item.valor_contratado ?? item.valorContratado ?? 0) || 0,
                valorRecebido: Number(item.valor_recebido ?? item.valorRecebido ?? 0) || 0,
                dataInicio: item.data_inicio || item.dataInicio || new Date().toISOString().split('T')[0],
                dataPrevisaoFim: item.data_previsao_fim || item.dataPrevisaoFim || null,
                createdAt: item.created_at || new Date().toISOString(),
              })) as unknown as T[];

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
          }
        }

        if (isFornecedores) {
          const { data: dbRows, error: dbErr } = await supabase
            .from('fornecedores')
            .select('*')
            .order('created_at', { ascending: false });

          if (!isMountedRef.current) return;

          if (!dbErr && Array.isArray(dbRows)) {
            const localMap = new Map<string, any>();
            localCached.forEach((lc: any) => {
              if (lc && lc.id) localMap.set(String(lc.id), lc);
            });

            const mapped = dbRows
              .filter((item: any) => item && (item.razao_social || item.nome_fantasia || item.nome) && !isDmsFolderObject(item))
              .map((item: any) => {
                const existing = localMap.get(String(item.id)) || {};
                const end = item.endereco || existing.endereco || {};
                let cidade = item.cidade || end.cidade || '';
                let estado = item.estado || end.estado || '';
                const cep = item.cep || end.cep || '';
                const logradouro = item.logradouro || end.logradouro || '';
                const numero = item.numero || end.numero || '';
                const complemento = item.complemento || end.complemento || '';
                const bairro = item.bairro || end.bairro || '';
                const pais = item.pais || end.pais || 'Brasil';

                if (cidade.toLowerCase() === 'são paulo' && estado.toUpperCase() === 'SP' && !logradouro && !cep && !bairro) {
                  cidade = '';
                  estado = '';
                }

                return {
                  ...existing,
                  id: String(item.id),
                  codigo: item.codigo || existing.codigo || `FOR-${String(item.id).slice(0, 4).toUpperCase()}`,
                  razaoSocial: item.razao_social || item.razaoSocial || existing.razaoSocial || 'Fornecedor',
                  nomeFantasia: item.nome_fantasia || item.nomeFantasia || item.razao_social || existing.nomeFantasia || 'Fornecedor',
                  cnpj: item.cnpj || item.documento || existing.cnpj || '00.000.000/0001-00',
                  documento: item.cnpj || item.documento || existing.documento || '00.000.000/0001-00',
                  tipo: item.tipo || existing.tipo || 'Pessoa Jurídica',
                  categoria: item.categoria || existing.categoria || 'Geral',
                  email: item.email || existing.email || '',
                  telefone: item.telefone || existing.telefone || '',
                  status: item.status || existing.status || 'Ativo',
                  endereco: {
                    cep,
                    logradouro,
                    numero,
                    complemento,
                    bairro,
                    cidade,
                    estado,
                    pais,
                  },
                  contatos: Array.isArray(item.contatos) && item.contatos.length > 0 ? item.contatos : (existing.contatos || []),
                  dadosBancarios: Array.isArray(item.dados_bancarios) ? item.dados_bancarios : (existing.dadosBancarios || []),
                  pixChave: item.pix_chave || item.chave_pix || existing.pixChave || existing.chavePix,
                  totalContratado: Number(item.total_contratado ?? existing.totalContratado ?? 0) || 0,
                  totalPago: Number(item.total_pago ?? existing.totalPago ?? 0) || 0,
                  saldoAberto: Number(item.saldo_aberto ?? existing.saldoAberto ?? 0) || 0,
                  createdAt: item.created_at || existing.dataCadastro || new Date().toISOString(),
                  dataCadastro: item.created_at || existing.dataCadastro || new Date().toISOString(),
                  ultimaAtualizacao: item.updated_at || existing.ultimaAtualizacao || new Date().toISOString(),
                };
              }) as unknown as T[];

            localCached.forEach((lc: any) => {
              if (lc && lc.id && !mapped.some((m: any) => m.id === lc.id)) {
                mapped.push(lc);
              }
            });

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
          }
        }

        if (isColaboradores) {
          const { data: dbRows, error: dbErr } = await supabase
            .from('colaboradores')
            .select('*')
            .order('created_at', { ascending: false });

          if (!isMountedRef.current) return;

          if (!dbErr && Array.isArray(dbRows)) {
            const mapped = dbRows
              .filter((item: any) => item && (item.nome || item.name) && !isDmsFolderObject(item))
              .map((item: any) => ({
                id: String(item.id),
                matricula: item.matricula || `COL-${String(item.id).slice(0, 4).toUpperCase()}`,
                nome: item.nome || item.name || 'Colaborador',
                cargo: item.cargo || 'Especialista',
                departamento: item.departamento || 'Tecnologia',
                email: item.email || '',
                telefone: item.telefone || '',
                cpf: item.cpf || item.documento || '',
                salario: Number(item.salario ?? 0) || 0,
                status: item.status || 'Ativo',
                dataAdmissao: item.data_admissao || item.dataAdmissao || new Date().toISOString().split('T')[0],
                createdAt: item.created_at || new Date().toISOString(),
              })) as unknown as T[];

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
          }
        }

        if (isClientsTable) {
          const { data: dbClientes, error: dbClientesErr } = await supabase
            .from('clientes')
            .select('*')
            .neq('status', 'deleted')
            .order('created_at', { ascending: false });

          if (!isMountedRef.current) return;

          const rawDeletedIds = safeGetItem('focus_app_deleted_client_ids');
          const deletedSet = new Set<string>(rawDeletedIds ? JSON.parse(rawDeletedIds) : []);
          const localMap = new Map<string, any>();
          localCached.forEach((lc: any) => {
            if (lc && lc.id) localMap.set(String(lc.id), lc);
          });

          if (!dbClientesErr && Array.isArray(dbClientes) && dbClientes.length > 0) {
            const mapped = dbClientes
              .filter((c: any) => {
                if (deletedSet.has(String(c.id))) return false;
                if (c.status === 'deleted' || c.status === 'deletado' || c.deleted === true) return false;
                if (c.name && typeof c.name === 'string' && c.name.startsWith('__USER_PROFILE__')) return false;
                return true;
              })
              .map((c: any) => {
                const existing = localMap.get(String(c.id)) || {};
                const end = c.endereco || existing.endereco || {};
                let cidade = c.cidade || end.cidade || '';
                let estado = c.estado || end.estado || '';
                const cep = c.cep || end.cep || '';
                const logradouro = c.logradouro || end.logradouro || '';
                const numero = c.numero || end.numero || '';
                const complemento = c.complemento || end.complemento || '';
                const bairro = c.bairro || end.bairro || '';
                const pais = c.pais || end.pais || 'Brasil';

                if (cidade.toLowerCase() === 'são paulo' && estado.toUpperCase() === 'SP' && !logradouro && !cep && !bairro) {
                  cidade = '';
                  estado = '';
                }

                return {
                  ...existing,
                  ...c,
                  id: String(c.id),
                  codigo: c.codigo || existing.codigo || `CLI-${String(c.id).slice(0, 4).toUpperCase()}`,
                  tipo: c.tipo || existing.tipo || 'Pessoa Jurídica',
                  razaoSocial: c.razao_social || c.razaoSocial || existing.razaoSocial || c.name || 'Cliente',
                  nomeFantasia: c.nome_fantasia || c.nomeFantasia || existing.nomeFantasia || c.razao_social || 'Cliente',
                  documento: c.documento || c.cnpj || c.cpf || existing.documento || '00.000.000/0001-00',
                  status: c.status === 'Inativo' ? 'Inativo' : (existing.status || 'Ativo'),
                  segmento: c.segmento || existing.segmento || 'Geral',
                  endereco: {
                    cep,
                    logradouro,
                    numero,
                    complemento,
                    bairro,
                    cidade,
                    estado,
                    pais,
                  },
                  contatos: (existing.contatos && existing.contatos.length > 0)
                    ? existing.contatos
                    : (Array.isArray(c.contatos) ? c.contatos : []),
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

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
          }

          // Fallback buscando em 'clients' caso 'clientes' ainda não possua registros
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
            const mapped = dbClients
              .filter((c: any) => {
                if (deletedSet.has(String(c.id))) return false;
                if (c.status === 'deleted' || c.status === 'deletado' || c.deleted === true) return false;
                if (typeof c.name === 'string' && (c.name.startsWith('__DELETED__') || c.name.startsWith('__FOCUS_'))) return false;
                return true;
              })
              .map((c: any) => {
                const existing = localMap.get(String(c.id)) || {};
                const end = c.endereco || existing.endereco || {};
                const cidade = c.cidade || end.cidade || '';
                const estado = c.estado || end.estado || '';
                const cep = c.cep || end.cep || '';
                const logradouro = c.logradouro || end.logradouro || '';
                const numero = c.numero || end.numero || '';
                const complemento = c.complemento || end.complemento || '';
                const bairro = c.bairro || end.bairro || '';
                const pais = c.pais || end.pais || 'Brasil';

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
                  endereco: {
                    cep,
                    logradouro,
                    numero,
                    complemento,
                    bairro,
                    cidade,
                    estado,
                    pais,
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

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
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

    // Supabase Realtime Subscription para Desktop & Mobile na tabela específica
    let channels: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        if (primaryDbTable) {
          const relChannel = supabase
            .channel(`rt_${primaryDbTable}_${Math.random().toString(36).slice(2, 7)}`)
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
        return updated;
      });

      if (primaryDbTable) {
        try {
          await supabase.from(primaryDbTable).delete().eq('id', id);
        } catch (err) {
          console.warn(`[useDataStore] Erro ao deletar no Supabase (${primaryDbTable}):`, err);
        }
      }
      if (isClientsTable) {
        try { await supabase.from('clients').delete().eq('id', id); } catch {}
        try { await supabase.from('clientes').delete().eq('id', id); } catch {}
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('focus_storage_update'));
      }
    },
    [isClientsTable, primaryDbTable, table]
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
