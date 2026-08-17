import { supabase } from '@/lib/supabaseClient';
import { clienteSchema, ClienteDTO } from '@/schemas/clienteSchema';

const LOCAL_STORAGE_KEYS = ['focus_app_focus_clientes', 'focus_app_clientes', 'focus_app_clients'];

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
          .order('created_at', { ascending: false });

        if (!clientsErr && Array.isArray(clientsData) && clientsData.length > 0) {
          dbItems = clientsData;
        }
      }

      if (dbItems.length > 0) {
        const result: ClienteDTO[] = [];
        for (const item of dbItems) {
          const mapped = {
            id: String(item.id),
            tenantId: item.tenant_id,
            codigo: item.codigo || `CLI-${(String(item.id).slice(0, 4)).toUpperCase()}`,
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
              if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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

    const payload = {
      id,
      tenant_id: validated.tenantId,
      codigo: validated.codigo,
      tipo: validated.tipo,
      razao_social: validated.razaoSocial,
      nome_fantasia: validated.nomeFantasia,
      documento: validated.documento,
      inscricao_estadual: validated.inscricaoEstadual,
      inscricao_municipal: validated.inscricaoMunicipal,
      data_fundacao_nascimento: validated.dataFundacaoNascimento,
      status: validated.status,
      segmento: validated.segmento,
      porte_empresa: validated.porteEmpresa,
      site: validated.site,
      observacoes: validated.observacoes,
      cep: validated.endereco.cep,
      logradouro: validated.endereco.logradouro,
      numero: validated.endereco.numero,
      complemento: validated.endereco.complemento,
      bairro: validated.endereco.bairro,
      cidade: validated.endereco.cidade,
      estado: validated.endereco.estado,
      pais: validated.endereco.pais,
      updated_at: new Date().toISOString()
    };

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
   * Excluir um cliente pelo ID
   */
  async deleteCliente(id: string): Promise<void> {
    // 1. Remover do LocalStorage de forma síncrona imediata
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

    // 2. Deletar no Supabase na tabela 'clientes' e 'clients'
    try {
      await supabase.from('clientes').delete().eq('id', id);
    } catch (err) {
      console.warn('[clienteService.deleteCliente] Warning deleting from clientes:', err);
    }

    try {
      await supabase.from('clients').delete().eq('id', id);
    } catch (err) {
      console.warn('[clienteService.deleteCliente] Warning deleting from clients:', err);
    }
  }
};
