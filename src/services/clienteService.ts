import { supabase } from '@/lib/supabaseClient';
import { clienteSchema, ClienteDTO } from '@/schemas/clienteSchema';

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
      // 1. Tentar buscar na tabela relacional 'clientes'
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const result: ClienteDTO[] = [];
        for (const item of data) {
          const mapped = {
            id: item.id,
            tenantId: item.tenant_id,
            codigo: item.codigo || `CLI-${(item.id?.slice(0, 4) || crypto.randomUUID().slice(0, 4)).toUpperCase()}`,
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
          } else {
            console.error(`[clienteService.getClientes] Falha na validação do cliente ${item.id}:`, parsed.error.format());
          }
        }
        return result;
      }

      // 2. Fallback de migração para focus_app_state ou LocalStorage
      const rawLocal = typeof window !== 'undefined' ? window.localStorage.getItem('focus_app_focus_clientes') : null;
      if (rawLocal) {
        const parsedLocal = JSON.parse(rawLocal);
        if (Array.isArray(parsedLocal)) return parsedLocal;
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

    const { error } = await supabase.from('clientes').upsert(payload);
    if (error) {
      console.error('[clienteService.saveCliente] Erro ao salvar cliente:', error);
      throw new Error(`Falha ao salvar cliente: ${error.message}`);
    }

    return { ...validated, id };
  },

  /**
   * Excluir um cliente pelo ID
   */
  async deleteCliente(id: string): Promise<void> {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) {
      console.error('[clienteService.deleteCliente] Erro ao deletar cliente:', error);
      throw new Error(`Falha ao deletar cliente: ${error.message}`);
    }
  }
};
