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

function sanitizeAddress(endereco: any) {
  if (!endereco) return { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', pais: 'Brasil' };
  
  let cidade = (endereco.cidade || '').trim();
  let estado = (endereco.estado || '').trim();
  const logradouro = (endereco.logradouro || '').trim();
  const cep = (endereco.cep || '').trim();
  const bairro = (endereco.bairro || '').trim();

  // Se cidade for São Paulo e estado SP mas não tiver nenhum logradouro, cep ou bairro preenchido, era o default estático inserido pelo schema antigo
  if (cidade.toLowerCase() === 'são paulo' && estado.toUpperCase() === 'SP' && !logradouro && !cep && !bairro) {
    cidade = '';
    estado = '';
  }

  return {
    cep,
    logradouro,
    numero: (endereco.numero || '').trim(),
    complemento: (endereco.complemento || '').trim(),
    bairro,
    cidade,
    estado,
    pais: (endereco.pais || '').trim() || 'Brasil'
  };
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
              const sanitizedItem = {
                ...item,
                endereco: sanitizeAddress(item.endereco)
              };
              const current = map.get(String(item.id));
              // Manter o mais completo (com endereço e contatos preenchidos)
              if (!current || (sanitizedItem.endereco?.cidade && !current.endereco?.cidade) || (sanitizedItem.endereco?.logradouro && !current.endereco?.logradouro) || (sanitizedItem.contatos?.length && !current.contatos?.length)) {
                map.set(String(item.id), sanitizedItem);
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

      // 1. Buscar na tabela 'clientes' (que possui colunas de endereço completas)
      try {
        const { data: clientesData, error: clientesErr } = await supabase
          .from('clientes')
          .select('*')
          .neq('status', 'deleted')
          .order('created_at', { ascending: false });

        if (!clientesErr && clientesData) {
          dbItems = [...dbItems, ...clientesData];
        }
      } catch (err) {
        console.warn('[clienteService.getClientes] Warning fetching clientes:', err);
      }

      // 2. Buscar na tabela relacional 'clients' (para compatibilidade com registros adicionais)
      try {
        const { data: clientsData, error: clientsErr } = await supabase
          .from('clients')
          .select('*')
          .not('name', 'like', '__FOCUS_STATE__%')
          .not('name', 'like', '__DELETED__%')
          .not('name', 'like', '__USER_PROFILE__%')
          .neq('status', 'user_profile')
          .neq('status', 'deleted')
          .order('created_at', { ascending: false });

        if (!clientsErr && clientsData) {
          dbItems = [...dbItems, ...clientsData];
        }
      } catch (err) {
        console.warn('[clienteService.getClientes] Warning fetching clients:', err);
      }

      // Mesclar dados do banco com o cache local (priorizando dados reais de endereço)
      if (dbItems.length > 0) {
        dbItems.forEach(item => {
          if (!item.id || deletedIds.has(String(item.id))) return;

          const id = String(item.id);
          const current = localMap.get(id);

          const rawEndereco = {
            cep: item.cep || item.endereco?.cep || current?.endereco?.cep || '',
            logradouro: item.logradouro || item.endereco?.logradouro || current?.endereco?.logradouro || '',
            numero: item.numero || item.endereco?.numero || current?.endereco?.numero || '',
            complemento: item.complemento || item.endereco?.complemento || current?.endereco?.complemento || '',
            bairro: item.bairro || item.endereco?.bairro || current?.endereco?.bairro || '',
            cidade: item.cidade || item.endereco?.cidade || current?.endereco?.cidade || '',
            estado: item.estado || item.endereco?.estado || current?.endereco?.estado || '',
            pais: item.pais || item.endereco?.pais || current?.endereco?.pais || 'Brasil',
          };

          const sanitizedEndereco = sanitizeAddress(rawEndereco);

          const candidate: ClienteDTO = {
            id,
            codigo: item.codigo || current?.codigo || `CLI-${id.slice(0, 4).toUpperCase()}`,
            tipo: (item.tipo === 'Pessoa Física' || item.tipo === 'PF') ? 'Pessoa Física' : 'Pessoa Jurídica',
            razaoSocial: item.razao_social || item.razaoSocial || item.name || current?.razaoSocial || 'Cliente',
            nomeFantasia: item.nome_fantasia || item.nomeFantasia || item.name || current?.nomeFantasia || item.razao_social || 'Cliente',
            documento: item.documento || item.cnpj || item.cpf || current?.documento || '00.000.000/0001-00',
            inscricaoEstadual: item.inscricao_estadual || item.inscricaoEstadual || current?.inscricaoEstadual || 'Isento',
            inscricaoMunicipal: item.inscricao_municipal || item.inscricaoMunicipal || current?.inscricaoMunicipal || '',
            dataFundacaoNascimento: item.data_fundacao || item.dataFundacaoNascimento || current?.dataFundacaoNascimento || '',
            status: item.status === 'inativo' ? 'Inativo' : 'Ativo',
            segmento: item.segmento || current?.segmento || 'Geral',
            porteEmpresa: item.porte || item.porteEmpresa || current?.porteEmpresa || 'Médio',
            site: item.site || current?.site || '',
            observacoes: item.observacoes || current?.observacoes || '',
            endereco: sanitizedEndereco,
            contatos: current?.contatos && current.contatos.length > 0 ? current.contatos : [
              {
                id: `ct-${id}`,
                nome: item.contact_name || item.name || 'Contato Principal',
                email: item.contact_email || item.email || 'contato@cliente.com',
                cargo: 'Responsável',
                celular: item.contact_phone || item.telefone || '(11) 99999-9999',
                principal: true,
              }
            ],
            dataCadastro: item.created_at || item.dataCadastro || current?.dataCadastro || new Date().toISOString(),
            ultimaAtualizacao: item.updated_at || item.ultimaAtualizacao || current?.ultimaAtualizacao || new Date().toISOString(),
          };

          // Validar contra schema
          const parsed = clienteSchema.safeParse(candidate);
          if (parsed.success) {
            localMap.set(id, parsed.data);
          } else {
            localMap.set(id, candidate);
          }
        });

        // Atualizar todas as chaves locais com a fusão consolidada
        persistClientsToAllStores(Array.from(localMap.values()));
      }

      return Array.from(localMap.values());
    } catch (e) {
      console.error('[clienteService.getClientes] Unexpected error, returning local store:', e);
      return Array.from(getLocalClients().values());
    }
  },

  /**
   * Salvar ou atualizar um cliente com persistência garantida
   */
  async saveCliente(cliente: ClienteDTO): Promise<ClienteDTO> {
    const id = cliente.id || crypto.randomUUID();

    const validatedWithId: ClienteDTO = {
      id,
      codigo: cliente.codigo || `CLI-${Math.floor(100 + Math.random() * 900)}`,
      tipo: cliente.tipo || 'Pessoa Jurídica',
      razaoSocial: cliente.razaoSocial || cliente.nomeFantasia || 'Cliente',
      nomeFantasia: cliente.nomeFantasia || cliente.razaoSocial || 'Cliente',
      documento: cliente.documento || '00.000.000/0001-00',
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
        cidade: cliente.endereco?.cidade || '',
        estado: cliente.endereco?.estado || '',
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
        status: validatedWithId.status.toLowerCase() === 'inativo' ? 'inativo' : 'ativo',
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
        inscricao_estadual: validatedWithId.inscricaoEstadual || 'Isento',
        tipo: validatedWithId.tipo || 'Pessoa Jurídica',
        status: validatedWithId.status === 'Inativo' ? 'Inativo' : 'Ativo',
        segmento: validatedWithId.segmento || 'Geral',
        cep: validatedWithId.endereco?.cep || null,
        logradouro: validatedWithId.endereco?.logradouro || null,
        numero: validatedWithId.endereco?.numero || null,
        bairro: validatedWithId.endereco?.bairro || null,
        cidade: validatedWithId.endereco?.cidade || null,
        estado: validatedWithId.endereco?.estado || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('[clienteService.saveCliente] Supabase sync completed via local-first store:', e);
    }

    return validatedWithId;
  },

  /**
   * Excluir um cliente pelo ID e remover em cascata suas recorrências, contratos e títulos futuros
   */
  async deleteCliente(id: string): Promise<void> {
    markClientAsDeletedLocally(id);

    const localMap = getLocalClients();
    const deletedClient = localMap.get(id);
    const clientNames = new Set<string>();
    if (deletedClient) {
      if (deletedClient.nomeFantasia) clientNames.add(deletedClient.nomeFantasia.trim().toLowerCase());
      if (deletedClient.razaoSocial) clientNames.add(deletedClient.razaoSocial.trim().toLowerCase());
    }

    localMap.delete(id);
    persistClientsToAllStores(Array.from(localMap.values()));

    // 1. Excluir TODAS as Recorrências ligadas a este cliente (por clientId ou por clienteNome)
    try {
      const rawRecs = safeGetItem('focus_recorrencias');
      if (rawRecs) {
        const recs = JSON.parse(rawRecs);
        if (Array.isArray(recs)) {
          const filteredRecs = recs.filter((r: any) => {
            if (!r) return false;
            if (r.clientId === id || r.clienteId === id) return false;
            if (r.clienteNome && clientNames.has(r.clienteNome.trim().toLowerCase())) return false;
            return true;
          });
          safeSetItem('focus_recorrencias', JSON.stringify(filteredRecs));
        }
      }
    } catch {}

    // 2. Excluir Contratos vinculados a este cliente
    try {
      const rawContratos = safeGetItem('focus_contratos');
      if (rawContratos) {
        const contratos = JSON.parse(rawContratos);
        if (Array.isArray(contratos)) {
          const filteredContratos = contratos.filter((c: any) => {
            if (!c) return false;
            if (c.clienteId === id || c.clientId === id) return false;
            if (c.clienteNome && clientNames.has(c.clienteNome.trim().toLowerCase())) return false;
            if (c.nome && clientNames.has(c.nome.trim().toLowerCase())) return false;
            return true;
          });
          safeSetItem('focus_contratos', JSON.stringify(filteredContratos));
        }
      }
    } catch {}

    // 3. Excluir títulos em aberto / programados no Contas a Receber
    try {
      const rawCR = safeGetItem('focus_contas_receber');
      if (rawCR) {
        const titulos = JSON.parse(rawCR);
        if (Array.isArray(titulos)) {
          const filteredCR = titulos.filter((t: any) => {
            if (!t) return false;
            if (t.clienteId === id || t.clientId === id) return false;
            if (t.cliente && clientNames.has(t.cliente.trim().toLowerCase())) return false;
            return true;
          });
          safeSetItem('focus_contas_receber', JSON.stringify(filteredCR));
        }
      }
    } catch {}

    // 4. Excluir do Supabase em cascata
    try { await supabase.from('recorrencias').delete().eq('client_id', id); } catch {}
    try { await supabase.from('recorrencias').delete().eq('cliente_id', id); } catch {}
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
      const { error: err2 } = await supabase.from('clientes').delete().eq('id', id);
      if (err2 && (err2.code === '23503' || err2.message?.includes('foreign key') || err2.message?.includes('Conflict'))) {
        await supabase.from('clientes').update({ status: 'inativo', updated_at: new Date().toISOString() }).eq('id', id);
      }
    } catch {}

    triggerClientSync();
  },
};
