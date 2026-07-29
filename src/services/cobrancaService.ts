import { supabase } from '@/lib/supabaseClient';
import { cobrancaSchema, CobrancaDTO } from '@/schemas/cobrancaSchema';

export const cobrancaService = {
  /**
   * Buscar todas as cobranças ativas na régua de cobrança
   */
  async getCobrancas(): Promise<CobrancaDTO[]> {
    try {
      const { data, error } = await supabase
        .from('cobrancas')
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
            clienteId: item.cliente_id,
            clienteNome,
            tituloId: item.titulo_id,
            valorTotal: Number(item.valor_total || item.valor || 0),
            diasAtraso: Number(item.dias_atraso || 0),
            etapaAtual: item.etapa_atual || 'Lembrete Preventivo',
            status: item.status || 'Em Aberto',
            historicoInteracoes: item.historico_interacoes || [],
            created_at: item.created_at,
            updated_at: item.updated_at,
          };
          const parsed = cobrancaSchema.safeParse(mapped);
          if (parsed.success) {
            return parsed.data;
          }
          console.error(`[cobrancaService.getCobrancas] Falha na validação da cobrança ${item.id}:`, parsed.error.format());
          return null;
        }).filter((item): item is CobrancaDTO => item !== null);
      }

      // Fallback LocalStorage
      const rawLocal = typeof window !== 'undefined' ? window.localStorage.getItem('focus_cobrancas') : null;
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed)) return parsed;
      }

      return [];
    } catch (err) {
      console.error('[cobrancaService.getCobrancas] Erro ao buscar cobranças:', err);
      return [];
    }
  },

  /**
   * Salvar ou atualizar régua de cobrança
   */
  async saveCobranca(cobranca: CobrancaDTO): Promise<CobrancaDTO> {
    const validated = cobrancaSchema.parse(cobranca);
    const id = validated.id || crypto.randomUUID();

    const payload = {
      id,
      tenant_id: validated.tenantId,
      cliente_id: validated.clienteId,
      titulo_id: validated.tituloId,
      valor_total: validated.valorTotal,
      dias_atraso: validated.diasAtraso,
      etapa_atual: validated.etapaAtual,
      status: validated.status,
      historico_interacoes: validated.historicoInteracoes,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('cobrancas').upsert(payload);
    if (error) {
      console.error('[cobrancaService.saveCobranca] Erro ao salvar cobrança:', error);
      throw new Error(`Falha ao salvar cobrança: ${error.message}`);
    }

    return { ...validated, id };
  },

  /**
   * Avançar etapa da régua de cobrança
   */
  async avancarEtapaCobranca(id: string, novaEtapa: string): Promise<CobrancaDTO> {
    const cobrancas = await this.getCobrancas();
    const cobranca = cobrancas.find(c => c.id === id);

    if (!cobranca) {
      throw new Error(`Cobrança ${id} não encontrada.`);
    }

    const novaInteracao = {
      data: new Date().toISOString(),
      etapaAnterior: cobranca.etapaAtual,
      etapaNova: novaEtapa,
      descricao: `Etapa alterada para ${novaEtapa}`,
    };

    const cobrancaAtualizada: CobrancaDTO = {
      ...cobranca,
      etapaAtual: novaEtapa,
      historicoInteracoes: [...(cobranca.historicoInteracoes || []), novaInteracao],
    };

    return this.saveCobranca(cobrancaAtualizada);
  }
};
