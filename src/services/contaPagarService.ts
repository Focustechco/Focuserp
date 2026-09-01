import { supabase } from '@/lib/supabaseClient';
import { contaPagarSchema, ContaPagarDTO } from '@/schemas/contaPagarSchema';

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

export const contaPagarService = {
  /**
   * Buscar todas as contas a pagar
   */
  async getContasPagar(): Promise<ContaPagarDTO[]> {
    try {
      const { data, error } = await supabase
        .from('contas_pagar')
        .select(`
          *,
          fornecedores:fornecedor_id (
            razao_social,
            nome_fantasia
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => {
          const fornecedorNome = item.fornecedores?.nome_fantasia || item.fornecedores?.razao_social || item.fornecedor_nome || '';
          const valorOrig = Number(item.valor_original || 0);
          const valPago = Number(item.valor_pago || 0);
          const desc = Number(item.desconto || 0);
          const mul = Number(item.multa || 0);
          const jur = Number(item.juros || 0);
          const valFinal = valorOrig - desc + mul + jur;
          const saldoDev = valFinal - valPago;

          const mapped = {
            id: item.id,
            tenantId: item.tenant_id,
            numero: item.numero,
            descricao: item.descricao,
            fornecedorId: item.fornecedor_id,
            fornecedorNome,
            categoria: item.categoria || 'Geral',
            centroCusto: item.centro_custo || '',
            valorOriginal: valorOrig,
            desconto: desc,
            multa: mul,
            juros: jur,
            valorFinal: valFinal,
            valorPago: valPago,
            saldo: saldoDev,
            saldoDevedor: saldoDev,
            dataEmissao: item.data_emissao,
            dataVencimento: item.data_vencimento,
            dataPagamento: item.data_pagamento,
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
          const parsed = contaPagarSchema.safeParse(mapped);
          if (parsed.success) {
            return parsed.data;
          }
          console.error(`[contaPagarService.getContasPagar] Falha na validação da conta ${item.id}:`, parsed.error.format());
          return null;
        }).filter((item): item is ContaPagarDTO => item !== null);
      }

      // Fallback LocalStorage
      const rawLocal = typeof window !== 'undefined' ? window.localStorage.getItem('focus_contas_pagar') : null;
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed)) return parsed;
      }

      return [];
    } catch (err) {
      console.error('[contaPagarService.getContasPagar] Erro ao buscar contas a pagar:', err);
      return [];
    }
  },

  /**
   * Salvar ou atualizar conta a pagar
   */
  async saveContaPagar(conta: ContaPagarDTO): Promise<ContaPagarDTO> {
    const validated = contaPagarSchema.parse(conta);
    const id = toValidUuid(validated.id);

    const payload: any = {
      id,
      tenant_id: toNullableValidUuid(validated.tenantId),
      numero: validated.numero || `PAG-${id.slice(0, 4).toUpperCase()}`,
      fornecedor_nome: validated.fornecedorNome || 'Fornecedor',
      descricao: validated.descricao || 'Despesa Operacional',
      categoria: validated.categoria || 'Geral',
      valor_original: Number(validated.valorOriginal || 0),
      valor_pago: Number(validated.valorPago || 0),
      data_emissao: validated.dataEmissao || new Date().toISOString().split('T')[0],
      data_vencimento: validated.dataVencimento || new Date().toISOString().split('T')[0],
      data_pagamento: validated.dataPagamento || null,
      forma_pagamento: validated.formaPagamento || 'Boleto',
      status: validated.status || 'Pendente',
      responsavel: validated.responsavel || 'Administrador',
      updated_at: new Date().toISOString(),
    };

    if (validated.fornecedorId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validated.fornecedorId)) {
      payload.fornecedor_id = validated.fornecedorId;
    }

    const { error } = await supabase.from('contas_pagar').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('[contaPagarService.saveContaPagar] Warning ao salvar conta a pagar:', error.message);
      if (payload.fornecedor_id) {
        await supabase.from('contas_pagar').upsert({ ...payload, fornecedor_id: null }, { onConflict: 'id' });
      }
    }

    // Atualizar cache local
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('focus_contas_pagar');
        const list: ContaPagarDTO[] = raw ? JSON.parse(raw) : [];
        const updated = [{ ...validated, id }, ...list.filter(c => c.id !== id)];
        window.localStorage.setItem('focus_contas_pagar', JSON.stringify(updated));
        window.localStorage.setItem('focus_app_focus_contas_pagar', JSON.stringify(updated));
        window.dispatchEvent(new Event('focus_storage_update'));
      } catch {}
    }

    return { ...validated, id };
  },

  /**
   * Excluir conta a pagar por ID
   */
  async deleteContaPagar(id: string): Promise<void> {
    // 1. Remover do Supabase
    try {
      await supabase.from('contas_pagar').delete().eq('id', id);
    } catch (e: any) {
      console.warn('[contaPagarService.deleteContaPagar] Warning:', e?.message);
    }

    // 2. Limpar caches locais
    if (typeof window !== 'undefined') {
      ['focus_app_focus_contas_pagar', 'focus_app_contas_pagar', 'focus_contas_pagar', 'focus_payables'].forEach((key) => {
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
      window.dispatchEvent(new Event('focus_storage_update'));
    }
  },

  /**
   * Realizar pagamento de conta a pagar
   */
  async pagarConta(id: string, valorPago?: number, dataPagamento?: string): Promise<ContaPagarDTO> {
    const contas = await this.getContasPagar();
    const conta = contas.find(c => c.id === id);

    if (!conta) {
      throw new Error(`Conta a pagar ${id} não encontrada para pagamento.`);
    }

    const valorEfetivado = valorPago !== undefined ? valorPago : conta.valorOriginal;
    const novoValorPago = (conta.valorPago || 0) + valorEfetivado;
    const totalDevido = conta.valorOriginal - (conta.desconto || 0) + (conta.multa || 0) + (conta.juros || 0);
    const novoStatus = novoValorPago >= totalDevido ? 'Pago' : 'Pago Parcialmente';
    const dtPagamento = dataPagamento || new Date().toISOString().split('T')[0];

    const contaAtualizada: ContaPagarDTO = {
      ...conta,
      valorPago: novoValorPago,
      saldo: Math.max(0, totalDevido - novoValorPago),
      saldoDevedor: Math.max(0, totalDevido - novoValorPago),
      dataPagamento: dtPagamento,
      status: novoStatus,
    };

    return this.saveContaPagar(contaAtualizada);
  }
};
