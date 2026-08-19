import { supabase } from '@/lib/supabaseClient';
import { clienteSchema, ClienteDTO } from '@/schemas/clienteSchema';

const LOCAL_STORAGE_KEYS = ['focus_app_focus_clientes', 'focus_app_clientes', 'focus_app_clients'];
const DELETED_IDS_KEY = 'focus_app_deleted_client_ids';

function getDeletedClientIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(DELETED_IDS_KEY);
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
    window.localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(deletedSet)));
  } catch {}
}

/**
 * Service de dados para o módulo de Clientes.
 * Responsável pela integração com a API do Supabase e validação via Zod.
 */
export const clienteService = {
  /**
   * Buscar todos os clientes da organização
   */
  async getClientes(): Promise<ClienteDTO[]> {
    try {
      const deletedIds = getDeletedClientIds();
      let dbItems: any[] = [];

      // 1. Tentar buscar na tabela relacional 'clientes'
      const { data: clientesData, error: clientesErr } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!clientesErr && Array.isArray(clientesData) && clientesData.length > 0) {
        dbItems = clientesData;
      } else {
        // Fallback: Tentar buscar na tabela 'clients'
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
      }

      if (dbItems.length > 0) {
        const result: ClienteDTO[] = [];
        for (const item of dbItems) {
          const itemId = String(item.id);
          if (deletedIds.has(itemId)) continue;
          if (item.status === 'deleted' || item.status === 'deletado' || item.deleted === true) continue;
          if (typeof item.name === 'string' && item.name.startsWith('__DELETED__')) continue;

          const mapped = {
            id: itemId,
            tenantId: item.tenant_id,
            codigo: item.codigo || `CLI-${itemId.slice(0, 4).toUpperCase()}`,
            tipo: item.tipo === 'Pessoa Física' ? 'Pessoa Física' : ('Pessoa Jurídica' as const),
            razaoSocial: item.razao_social || item.name || 'Cliente sem nome',
            nomeFantasia: item.nome_fantasia || item.name || 'Cliente sem nome',
            documento: item.documento || '00.000.000/0001-00',
            inscricaoEstadual: item.inscricao_estadual,
            inscricaoMunicipal: item.inscricao_municipal,
            dataFundacaoNascimento: item.data_fundacao_nascimento,
            status: item.status === 'inativo' || item.status === 'Inativo' ? 'Inativo' : ('Ativo' as const),
            segmento: item.segmento || 'Geral',
            porteEmpresa: item.porte_empresa,
            site: item.site,
            observacoes: item.observacoes,
            endereco: {
              cep: item.cep || '',
              logradouro: item.logradouro || '',
              numero: item.numero || '',
              complemento: item.complemento,
              bairro: item.bairro || '',
              cidade: item.cidade || 'São Paulo',
              estado: item.estado || 'SP',
              pais: item.pais || 'Brasil'
            },
            contatos: [],
            dataCadastro: item.created_at || new Date().toISOString(),
            ultimaAtualizacao: item.updated_at || new Date().toISOString()
          };
          const parsed = clienteSchema.safeParse(mapped);
          if (parsed.success) {
            result.push(parsed.data);
          }
        }
        return result;
      }

      // 2. Fallback de LocalStorage
      if (typeof window !== 'undefined') {
        for (const key of LOCAL_STORAGE_KEYS) {
          const raw = window.localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.filter((c: any) => !deletedIds.has(String(c.id)));
              }
            } catch {}
          }
        }
      }

      return [];
    } catch (err) {
      console.error('[clienteService.getClientes] Erro ao buscar clientes:', err);
      return [];
    }
  },

  /**
   * Salvar ou atualizar um cliente
   */
  async saveCliente(cliente: ClienteDTO): Promise<ClienteDTO> {
    const validated = clienteSchema.parse(cliente);
    const id = validated.id || crypto.randomUUID();
    const validatedWithId = { ...validated, id };

    // 1. Salvar no LocalStorage para resposta instantânea
    if (typeof window !== 'undefined') {
      for (const key of LOCAL_STORAGE_KEYS) {
        try {
          const raw = window.localStorage.getItem(key);
          const current: ClienteDTO[] = raw ? JSON.parse(raw) : [];
          const updated = [validatedWithId, ...current.filter((c) => c.id !== id)];
          window.localStorage.setItem(key, JSON.stringify(updated));
        } catch {}
      }
    }

    // 2. Persistir no Supabase
    try {
      const payload = {
        id,
        tipo: validated.tipo,
        razao_social: validated.razaoSocial,
        nome_fantasia: validated.nomeFantasia,
        documento: validated.documento,
        inscricao_estadual: validated.inscricaoEstadual,
        inscricao_municipal: validated.inscricaoMunicipal,
        status: validated.status,
        segmento: validated.segmento,
        porte_empresa: validated.porteEmpresa,
        site: validated.site,
        observacoes: validated.observacoes,
        cep: validated.endereco?.cep || '',
        logradouro: validated.endereco?.logradouro || '',
        numero: validated.endereco?.numero || '',
        complemento: validated.endereco?.complemento || '',
        bairro: validated.endereco?.bairro || '',
        cidade: validated.endereco?.cidade || 'São Paulo',
        estado: validated.endereco?.estado || 'SP',
        pais: validated.endereco?.pais || 'Brasil',
        updated_at: new Date().toISOString()
      };
      await supabase.from('clientes').upsert(payload);
    } catch (e) {
      console.warn('[clienteService.saveCliente] Warning upserting to clientes:', e);
    }

    try {
      await supabase.from('clients').upsert({
        id,
        name: validated.nomeFantasia || validated.razaoSocial,
        status: validated.status.toLowerCase(),
        contact_email: validated.contatos?.[0]?.email || null,
        contact_phone: validated.contatos?.[0]?.celular || null,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('[clienteService.saveCliente] Warning upserting to clients:', e);
    }

    return validatedWithId;
  },

  /**
   * Excluir um cliente pelo ID (suporta exclusão em cascata e fallback de 409 FK Constraint)
   */
  async deleteCliente(id: string): Promise<void> {
    // 1. Marcar como excluído localmente de forma instantânea e persistente
    markClientAsDeletedLocally(id);

    // 2. Remover de todos os caches do LocalStorage
    if (typeof window !== 'undefined') {
      for (const key of LOCAL_STORAGE_KEYS) {
        try {
          const raw = window.localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((c: any) => c.id !== id);
              window.localStorage.setItem(key, JSON.stringify(filtered));
            }
          }
        } catch (e) {
          console.warn(`[clienteService.deleteCliente] LocalStorage error for key ${key}:`, e);
        }
      }
    }

    // 3. Tentar remover referências filhas se existirem
    try { await supabase.from('contas_receber').delete().eq('cliente_id', id); } catch {}
    try { await supabase.from('contratos').delete().eq('cliente_id', id); } catch {}
    try { await supabase.from('projetos').delete().eq('cliente_id', id); } catch {}

    // 4. Executar DELETE no Supabase na tabela 'clientes' (com fallback para soft-delete em caso de 409 FK)
    try {
      const { error: err1 } = await supabase.from('clientes').delete().eq('id', id);
      if (err1 && (err1.code === '23503' || err1.message?.includes('foreign key') || err1.message?.includes('Conflict'))) {
        await supabase.from('clientes').update({ status: 'Inativo', updated_at: new Date().toISOString() }).eq('id', id);
      }
    } catch (err) {
      console.warn('[clienteService.deleteCliente] Warning deleting from clientes:', err);
    }

    // 5. Executar DELETE no Supabase na tabela 'clients' (com fallback para soft-delete em caso de 409 FK)
    try {
      const { error: err2 } = await supabase.from('clients').delete().eq('id', id);
      if (err2 && (err2.code === '23503' || err2.message?.includes('foreign key') || err2.message?.includes('Conflict'))) {
        await supabase.from('clients').update({ status: 'inativo', name: `__DELETED__${id}`, updated_at: new Date().toISOString() }).eq('id', id);
      }
    } catch (err) {
      console.warn('[clienteService.deleteCliente] Warning deleting from clients:', err);
    }
  }
};
