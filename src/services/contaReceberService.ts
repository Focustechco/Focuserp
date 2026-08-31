import { supabase } from '@/lib/supabaseClient';
import { contaReceberSchema, ContaReceberDTO } from '@/schemas/contaReceberSchema';

function toValidUuid(id?: string | null): string {
  if (!id || typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return crypto.randomUUID();
  }
  return id;
}

function toNullableValidUuid(id?: string | null): string | null {
  if (!id || typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return null;
  }
  return id;
}

export const contaReceberService = {
  /**
   * Buscar todas as contas a receber
   */
  async getContasReceber(): Promise<ContaReceberDTO[]> {
    try {
      const { data, error } = await supabase
        .from('contas_receber')
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
          const valorOrig = Number(item.valor_original || 0);
          const valRecebido = Number(item.valor_recebido || 0);
          const desc = Number(item.desconto || 0);
          const mul = Number(item.multa || 0);
          const jur = Number(item.juros || 0);
          const netBal = valorOrig - desc + mul + jur;
          const saldoDev = netBal - valRecebido;

          const mapped = {
            id: item.id,
            tenantId: item.tenant_id,
            numero: item.numero,
            descricao: item.descricao,
            clienteId: item.cliente_id,
            clienteNome,
            categoria: item.categoria || 'Geral',
            valorOriginal: valorOrig,
            desconto: desc,
            multa: mul,
            juros: jur,
            valorLiquido: netBal,
            valorRecebido: valRecebido,
            saldo: saldoDev,
            saldoDevedor: saldoDev,
            netBalance: netBal,
            dataEmissao: item.data_emissao,
            dataVencimento: item.data_vencimento,
            dataRecebimento: item.data_recebimento,
            dataPagamento: item.data_recebimento,
            formaPagamento: item.forma_pagamento || 'PIX',
            status: item.status || 'Pendente',
            responsavel: item.responsavel,
            competencia: item.competencia,
            observacoes: item.observacoes,
            tags: item.tags || [],
            recorrente: Boolean(item.recorrente),
            recorrenciaFrequencia: item.recorrencia_frequencia,
            recorrenciaFim: item.recorrencia_fim,
            created_at: item.created_at,
            updated_at: item.updated_at,
          };
          const parsed = contaReceberSchema.safeParse(mapped);
          if (parsed.success) {
            return parsed.data;
          }
          console.error(`[contaReceberService.getContasReceber] Falha na validação da conta ${item.id}:`, parsed.error.format());
          return null;
        }).filter((item): item is ContaReceberDTO => item !== null);
      }

      // Fallback LocalStorage
      const rawLocal = typeof window !== 'undefined' ? window.localStorage.getItem('focus_contas_receber') : null;
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed)) return parsed;
      }

      return [];
    } catch (err) {
      console.error('[contaReceberService.getContasReceber] Erro ao buscar contas a receber:', err);
      return [];
    }
  },

  /**
   * Salvar ou atualizar conta a receber
   */
  async saveContaReceber(conta: ContaReceberDTO): Promise<ContaReceberDTO> {
    const validated = contaReceberSchema.parse(conta);
    const id = toValidUuid(validated.id);

    const payload = {
      id,
      tenant_id: toNullableValidUuid(validated.tenantId),
      cliente_id: toNullableValidUuid(validated.clienteId),
      numero: validated.numero || `CR-${id.slice(0, 6).toUpperCase()}`,
      descricao: validated.descricao,
      categoria: validated.categoria,
      valor_original: validated.valorOriginal,
      desconto: validated.desconto,
      multa: validated.multa,
      juros: validated.juros,
      valor_recebido: validated.valorRecebido,
      data_emissao: validated.dataEmissao || new Date().toISOString().split('T')[0],
      data_vencimento: validated.dataVencimento,
      data_recebimento: validated.dataPagamento || validated.dataRecebimento,
      forma_pagamento: validated.formaPagamento,
      status: validated.status,
      responsavel: validated.responsavel,
      competencia: validated.competencia,
      observacoes: validated.observacoes,
      tags: validated.tags,
      recorrente: validated.recorrente,
      recorrencia_frequencia: validated.recorrenciaFrequencia,
      recorrencia_fim: validated.recorrenciaFim,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('contas_receber').upsert(payload, { onConflict: 'id' });
    if (error) {
      const safePayload = { ...payload, cliente_id: null };
      await supabase.from('contas_receber').upsert(safePayload, { onConflict: 'id' });
    }

    return { ...validated, id };
  },

  /**
   * Excluir conta a receber por ID
   */
  async deleteContaReceber(id: string): Promise<void> {
    if (typeof window !== 'undefined') {
      ['focus_app_focus_contas_receber', 'focus_app_contas_receber', 'focus_contas_receber', 'focus_receivables'].forEach((key) => {
        try {
          const raw = window.localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((item: any) => item.id !== id);
              window.localStorage.setItem(key, JSON.stringify(filtered));
            }
          }
        } catch {}
      });
    }

    try {
      await supabase.from('contas_receber').delete().eq('id', id);
    } catch (e: any) {
      console.warn('[contaReceberService.deleteContaReceber] Warning:', e?.message);
    }

    try {
      await supabase.from('receivables').delete().eq('id', id);
    } catch {}
  },

  /**
   * Realizar baixa do título a receber (pagamento recebido)
   */
  async baixarTitulo(id: string, valorPago?: number, dataPagamento?: string): Promise<ContaReceberDTO> {
    const contas = await this.getContasReceber();
    const conta = contas.find(c => c.id === id);

    if (!conta) {
      throw new Error(`Conta a receber ${id} não encontrada para baixa.`);
    }

    const valorEfetivado = valorPago !== undefined ? valorPago : conta.valorOriginal;
    const novoValorRecebido = (conta.valorRecebido || 0) + valorEfetivado;
    const totalDevido = conta.valorOriginal - (conta.desconto || 0) + (conta.multa || 0) + (conta.juros || 0);
    const novoStatus = novoValorRecebido >= totalDevido ? 'Recebido' : 'Recebido Parcialmente';
    const dtPagamento = dataPagamento || new Date().toISOString().split('T')[0];

    const contaAtualizada: ContaReceberDTO = {
      ...conta,
      valorRecebido: novoValorRecebido,
      saldo: Math.max(0, totalDevido - novoValorRecebido),
      saldoDevedor: Math.max(0, totalDevido - novoValorRecebido),
      dataRecebimento: dtPagamento,
      dataPagamento: dtPagamento,
      status: novoStatus,
    };

    return this.saveContaReceber(contaAtualizada);
  }
};
