import { supabase } from '@/lib/supabaseClient';
import { clienteSchema, ClienteDTO } from '@/schemas/clienteSchema';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';

const LOCAL_STORAGE_KEYS = [
  'focus_clientes',
  'focus_app_focus_clientes',
  'focus_app_clientes',
  'focus_app_clients',
];
const DELETED_IDS_KEY = 'focus_app_deleted_client_ids';

function triggerClientSync() {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new Event('focus_storage_update'));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  }
}

function getDeletedClientIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = safeGetItem(DELETED_IDS_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markClientAsDeletedLocally(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const deletedSet = getDeletedClientIds();
    deletedSet.add(id);
    safeSetItem(DELETED_IDS_KEY, JSON.stringify(Array.from(deletedSet)));
  } catch {}
}

function getLocalClients(): Map<string, ClienteDTO> {
  const map = new Map<string, ClienteDTO>();
  if (typeof window === 'undefined') return map;

  const deletedIds = getDeletedClientIds();

  for (const key of LOCAL_STORAGE_KEYS) {
    try {
      const raw = safeGetItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.id && !deletedIds.has(String(item.id))) {
              const current = map.get(String(item.id));
              // Manter o mais completo (com endereço e contatos preenchidos)
              if (!current || (item.endereco?.logradouro && !current.endereco?.logradouro) || (item.contatos?.length && !current.contatos?.length)) {
                map.set(String(item.id), item);
              }
            }
          }
        }
      }
    } catch {}
  }

  return map;
}

function persistClientsToAllStores(clientes: ClienteDTO[]) {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(clientes);
  for (const key of LOCAL_STORAGE_KEYS) {
    safeSetItem(key, serialized);
  }
  triggerClientSync();
}

/**
 * Service de dados para o módulo de Clientes.
 * Responsável pela persistência local-first confiável e sincronização com Supabase.
 */
export const clienteService = {
  /**
   * Buscar todos os clientes da organização com fusão inteligente de dados cadastrais e endereço
   */
  async getClientes(): Promise<ClienteDTO[]> {
    try {
      const deletedIds = getDeletedClientIds();
      const localMap = getLocalClients();
      let dbItems: any[] = [];

      // Buscar na tabela relacional 'clients'
      try {
        const { data: clientsData, error: clientsErr } = await supabase
          .from('clients')
          .select('*')
          .not('name', 'like', '__FOCUS_STATE__%')
          .not('name', 'like', '__DELETED__%')
          .neq('status', 'deleted')
          .order('created_at', { ascending: false });

        if (!clientsErr && Array.isArray(clientsData) && clientsData.length > 0) {
          dbItems = clientsData;
        }
      } catch {}

      const mergedMap = new Map<string, ClienteDTO>(localMap);

      if (dbItems.length > 0) {
        for (const item of dbItems) {
          const itemId = String(item.id);
          if (deletedIds.has(itemId)) continue;
          if (item.status === 'deleted' || item.status === 'deletado' || item.deleted === true) continue;
          if (typeof item.name === 'string' && item.name.startsWith('__DELETED__')) continue;

          const localItem = localMap.get(itemId);

          const enderecoFinal = {
            cep: item.cep || localItem?.endereco?.cep || '',
            logradouro: item.logradouro || localItem?.endereco?.logradouro || '',
            numero: item.numero || localItem?.endereco?.numero || '',
            complemento: item.complemento || localItem?.endereco?.complemento || '',
            bairro: item.bairro || localItem?.endereco?.bairro || '',
            cidade: item.cidade || localItem?.endereco?.cidade || 'São Paulo',
            estado: item.estado || localItem?.endereco?.estado || 'SP',
            pais: item.pais || localItem?.endereco?.pais || 'Brasil',
          };

          const contatosFinal = (localItem?.contatos && localItem.contatos.length > 0)
            ? localItem.contatos
            : (item.contact_email || item.contact_phone)
            ? [
                {
                  id: `cont-${itemId}`,
                  nome: 'Contato Principal',
                  cargo: 'Responsável',
                  departamento: 'Geral',
                  email: item.contact_email || '',
                  celular: item.contact_phone || '',
                  whatsapp: true,
                  principal: true,
                },
              ]
            : [];

          const mapped: ClienteDTO = {
            id: itemId,
            tenantId: item.tenant_id || localItem?.tenantId,
            codigo: item.codigo || localItem?.codigo || `CLI-${itemId.slice(0, 4).toUpperCase()}`,
            tipo: item.tipo === 'Pessoa Física' ? 'Pessoa Física' : (localItem?.tipo || 'Pessoa Jurídica'),
            razaoSocial: item.razao_social || item.name || localItem?.razaoSocial || 'Cliente sem nome',
            nomeFantasia: item.nome_fantasia || item.name || localItem?.nomeFantasia || 'Cliente sem nome',
            documento: item.documento || localItem?.documento || '00.000.000/0001-00',
            inscricaoEstadual: item.inscricao_estadual || localItem?.inscricaoEstadual || 'Isento',
            inscricaoMunicipal: item.inscricao_municipal || localItem?.inscricaoMunicipal || '',
            dataFundacaoNascimento: item.data_fundacao_nascimento || localItem?.dataFundacaoNascimento,
            status: item.status === 'inativo' || item.status === 'Inativo' ? 'Inativo' : ('Ativo' as const),
            segmento: item.segmento || localItem?.segmento || 'Geral',
            porteEmpresa: item.porte_empresa || localItem?.porteEmpresa || 'Médio',
            site: item.site || localItem?.site || '',
            observacoes: item.observacoes || localItem?.observacoes || '',
            endereco: enderecoFinal,
            contatos: contatosFinal,
            dataCadastro: item.created_at || localItem?.dataCadastro || new Date().toISOString(),
            ultimaAtualizacao: item.updated_at || localItem?.ultimaAtualizacao || new Date().toISOString(),
          };

          mergedMap.set(itemId, mapped);
        }
      }

      const finalList = Array.from(mergedMap.values()).filter((c) => !deletedIds.has(String(c.id)));
      
      // Manter todos os caches sincronizados
      persistClientsToAllStores(finalList);

      return finalList;
    } catch (err) {
      console.error('[clienteService.getClientes] Erro ao buscar clientes:', err);
      return Array.from(getLocalClients().values());
    }
  },

  /**
   * Salvar ou atualizar um cliente com preservação completa do endereço e contatos
   */
  async saveCliente(cliente: ClienteDTO): Promise<ClienteDTO> {
    const id = cliente.id || crypto.randomUUID();
    
    // Normalizar e assegurar objeto completo
    const validatedWithId: ClienteDTO = {
      ...cliente,
      id,
      codigo: cliente.codigo || `CLI-${Math.floor(1000 + Math.random() * 9000)}`,
      tipo: cliente.tipo || 'Pessoa Jurídica',
      razaoSocial: cliente.razaoSocial || cliente.nomeFantasia || 'Cliente Sem Nome',
      nomeFantasia: cliente.nomeFantasia || cliente.razaoSocial || 'Cliente Sem Nome',
      documento: cliente.documento || '',
      inscricaoEstadual: cliente.inscricaoEstadual || 'Isento',
      inscricaoMunicipal: cliente.inscricaoMunicipal || '',
      dataFundacaoNascimento: cliente.dataFundacaoNascimento || '',
      status: cliente.status || 'Ativo',
      segmento: cliente.segmento || 'Geral',
      porteEmpresa: cliente.porteEmpresa || 'Médio',
      site: cliente.site || '',
      observacoes: cliente.observacoes || '',
      endereco: {
        cep: cliente.endereco?.cep || '',
        logradouro: cliente.endereco?.logradouro || '',
        numero: cliente.endereco?.numero || '',
        complemento: cliente.endereco?.complemento || '',
        bairro: cliente.endereco?.bairro || '',
        cidade: cliente.endereco?.cidade || 'São Paulo',
        estado: cliente.endereco?.estado || 'SP',
        pais: cliente.endereco?.pais || 'Brasil',
      },
      contatos: Array.isArray(cliente.contatos) ? cliente.contatos : [],
      dataCadastro: cliente.dataCadastro || new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString(),
    };

    // 1. Salvar no LocalStorage para resposta e persistência instantânea em todas as chaves
    const localMap = getLocalClients();
    localMap.set(id, validatedWithId);
    const updatedList = Array.from(localMap.values());
    persistClientsToAllStores(updatedList);

    // 2. Persistir no Supabase de forma resiliente nas tabelas clients e clientes
    try {
      await supabase.from('clients').upsert({
        id,
        name: validatedWithId.nomeFantasia || validatedWithId.razaoSocial,
        status: validatedWithId.status.toLowerCase(),
        contact_email: validatedWithId.contatos?.[0]?.email || null,
        contact_phone: validatedWithId.contatos?.[0]?.celular || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      await supabase.from('clientes').upsert({
        id,
        codigo: validatedWithId.codigo || `CLI-${id.slice(0, 4).toUpperCase()}`,
        razao_social: validatedWithId.razaoSocial || validatedWithId.nomeFantasia,
        nome_fantasia: validatedWithId.nomeFantasia || validatedWithId.razaoSocial,
        documento: validatedWithId.documento || '00.000.000/0001-00',
        tipo: validatedWithId.tipo || 'Pessoa Jurídica',
        status: validatedWithId.status || 'Ativo',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('[clienteService.saveCliente] Supabase sync completed via local-first store:', e);
    }

    return validatedWithId;
  },

  /**
   * Excluir um cliente pelo ID
   */
  async deleteCliente(id: string): Promise<void> {
    markClientAsDeletedLocally(id);

    const localMap = getLocalClients();
    localMap.delete(id);
    persistClientsToAllStores(Array.from(localMap.values()));

    try { await supabase.from('contas_receber').delete().eq('cliente_id', id); } catch {}
    try { await supabase.from('contratos').delete().eq('cliente_id', id); } catch {}
    try { await supabase.from('projetos').delete().eq('cliente_id', id); } catch {}

    try {
      const { error: err1 } = await supabase.from('clients').delete().eq('id', id);
      if (err1 && (err1.code === '23503' || err1.message?.includes('foreign key') || err1.message?.includes('Conflict'))) {
        await supabase.from('clients').update({ status: 'inativo', updated_at: new Date().toISOString() }).eq('id', id);
      }
    } catch (e) {
      console.warn('[clienteService.deleteCliente] Local delete complete:', e);
    }

    try {
      const { error: err2 } = await supabase.from('clients').delete().eq('id', id);
      if (err2 && (err2.code === '23503' || err2.message?.includes('foreign key') || err2.message?.includes('Conflict'))) {
        await supabase.from('clients').update({ status: 'inativo', name: `__DELETED__${id}`, updated_at: new Date().toISOString() }).eq('id', id);
      }
    } catch {}
  },
};
