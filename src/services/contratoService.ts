import { supabase } from '@/lib/supabaseClient';
import { contratoSchema, ContratoDTO } from '@/schemas/contratoSchema';
import { dmsService } from '@/services/dmsService';

export const contratoService = {
  /**
   * Buscar todos os contratos
   */
  async getContratos(): Promise<ContratoDTO[]> {
    try {
      const { data, error } = await supabase
        .from('contratos')
        .select(`
          *,
          clientes:cliente_id (
            razao_social,
            nome_fantasia
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => {
          const clienteNome = item.clientes?.nome_fantasia || item.clientes?.razao_social || item.cliente_nome || '';

          const mapped = {
            id: item.id,
            tenantId: item.tenant_id,
            numeroContrato: item.numero_contrato || item.numero || `CTR-${item.id?.slice(0, 6)}`,
            clienteId: item.cliente_id,
            clienteNome,
            objetoContrato: item.objeto_contrato || item.objeto || item.descricao || 'Prestação de Serviços',
            valorTotal: Number(item.valor_total || item.valor || 0),
            valorMensal: Number(item.valor_mensal || 0),
            tipoContrato: item.tipo_contrato || item.tipo || 'Prestação de Serviços',
            dataInicio: item.data_inicio || item.created_at,
            dataFim: item.data_fim,
            status: item.status || 'Ativo',
            renovacaoAutomatica: Boolean(item.renovacao_automatica),
            created_at: item.created_at,
            updated_at: item.updated_at,
          };
          const parsed = contratoSchema.safeParse(mapped);
          if (parsed.success) {
            return parsed.data;
          }
          console.error(`[contratoService.getContratos] Falha na validação do contrato ${item.id}:`, parsed.error.format());
          return null;
        }).filter((item): item is ContratoDTO => item !== null);
      }

      // Fallback LocalStorage
      const rawLocal = typeof window !== 'undefined' ? window.localStorage.getItem('focus_contratos') : null;
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed)) {
          return parsed.filter((c: any) => c && !c.caminhoCompleto && c.parentId === undefined && (c.numeroContrato || c.objetoContrato || c.valorTotal));
        }
      }

      return [];
    } catch (err) {
      console.error('[contratoService.getContratos] Erro ao buscar contratos:', err);
      return [];
    }
  },

  /**
   * Salvar ou atualizar contrato
   */
  async saveContrato(contrato: ContratoDTO): Promise<ContratoDTO> {
    const validated = contratoSchema.parse(contrato);
    const id = validated.id || crypto.randomUUID();

    const payload = {
      id,
      tenant_id: validated.tenantId,
      cliente_id: validated.clienteId,
      numero_contrato: validated.numeroContrato,
      objeto_contrato: validated.objetoContrato,
      valor_total: validated.valorTotal,
      valor_mensal: validated.valorMensal,
      tipo_contrato: validated.tipoContrato,
      data_inicio: validated.dataInicio,
      data_fim: validated.dataFim,
      status: validated.status,
      renovacao_automatica: validated.renovacaoAutomatica,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('contratos').upsert(payload);
    if (error) {
      console.error('[contratoService.saveContrato] Erro ao salvar contrato:', error);
      throw new Error(`Falha ao salvar contrato: ${error.message}`);
    }

    // Auto-sincronizar no repositório central de Gestão de Documentos (DMS)
    try {
      dmsService.uploadFileFromModule({
        nome: `Contrato_${validated.numeroContrato}_${(validated.clienteNome || 'Cliente').replace(/\s+/g, '_')}.pdf`,
        extensao: 'pdf',
        tamanho: '2.1 MB',
        tamanhoBytes: 2202009,
        moduloOrigem: 'Contratos',
        clienteId: validated.clienteId,
        clienteNome: validated.clienteNome,
        contratoId: id,
        contratoNumero: validated.numeroContrato,
        categoria: `Contrato (${validated.tipoContrato})`,
        tags: ['Contratos', validated.status, validated.clienteNome || 'Cliente'],
        responsavelUpload: 'Módulo Contratos',
      });
    } catch {}

    return { ...validated, id };
  },

  /**
   * Excluir contrato por ID
   */
  async deleteContrato(id: string): Promise<void> {
    const { error } = await supabase.from('contratos').delete().eq('id', id);
    if (error) {
      console.error('[contratoService.deleteContrato] Erro ao deletar contrato:', error);
      throw new Error(`Falha ao deletar contrato: ${error.message}`);
    }
  }
};
