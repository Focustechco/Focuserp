import { supabase } from '@/lib/supabaseClient';
import {
  tituloReceberSchema,
  contaPagarSchema,
  TituloReceberDTO,
  ContaPagarDTO,
} from '@/schemas/financeiroSchema';

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

/**
 * Service de dados para o módulo Financeiro (Contas a Receber e Contas a Pagar).
 */
export const financeiroService = {
  // ==========================================
  // CONTAS A RECEBER
  // ==========================================
  async getContasReceber(): Promise<TituloReceberDTO[]> {
    try {
      // 1. Buscar na tabela relacional 'contas_receber'
      const { data, error } = await supabase
        .from('contas_receber')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (!error && Array.isArray(data)) {
        const mapped = data.map((item: any) => {
          const valorOrig = Number(item.valor_original ?? item.valorOriginal ?? item.valor ?? 0) || 0;
          const valorRec = Number(item.valor_recebido ?? item.valorRecebido ?? 0) || 0;
          const saldoCalculado = Number(item.saldo ?? (valorOrig - valorRec)) || 0;
          const vencimento = item.data_vencimento || item.dataVencimento || item.vencimento || new Date().toISOString().split('T')[0];

          return {
            id: String(item.id || crypto.randomUUID()),
            numero: item.numero || item.codigo || `REC-${String(item.id || '').slice(0, 4).toUpperCase()}`,
            cliente: item.cliente_nome || item.cliente || item.clienteNome || 'Cliente',
            clienteId: item.cliente_id || item.clienteId,
            descricao: item.descricao || 'Recebimento de título',
            categoria: item.categoria || 'Receita Operacional',
            valorOriginal: valorOrig,
            valorRecebido: valorRec,
            saldo: saldoCalculado,
            dataEmissao: item.data_emissao || item.dataEmissao || new Date().toISOString().split('T')[0],
            dataVencimento: vencimento,
            dataRecebimento: item.data_recebimento || item.dataRecebimento,
            formaPagamento: item.forma_pagamento || item.formaPagamento || 'PIX',
            status: item.status || 'Pendente',
            responsavel: item.responsavel || 'Administrador',
            ultimaAtualizacao: item.updated_at || item.ultimaAtualizacao || new Date().toISOString(),
            historico: Array.isArray(item.historico) ? item.historico : [],
            parcelas: Array.isArray(item.parcelas) ? item.parcelas : [],
            recorrente: Boolean(item.recorrente),
            recorrenciaId: item.recorrencia_id || item.recorrenciaId,
            origem: item.origem || (item.recorrente ? 'recorrencia' : 'manual'),
          };
        });

        // Sincronizar cache local com dados reais do banco com proteção contra QuotaExceededError
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem('focus_app_focus_contas_receber', JSON.stringify(mapped));
          } catch (e: any) {
            // Em caso de quota atingida, limpa caches não críticos
            try {
              window.localStorage.removeItem('focus_app_notificacoes');
              window.localStorage.setItem('focus_app_focus_contas_receber', JSON.stringify(mapped));
            } catch {
              // Silently ignore localStorage quota limits
            }
          }
        }

        return mapped;
      }

      // 2. Fallback de cache local se offline
      const rawLocal = typeof window !== 'undefined' ? window.localStorage.getItem('focus_app_focus_contas_receber') : null;
      if (rawLocal) {
        try {
          const parsedLocal = JSON.parse(rawLocal);
          if (Array.isArray(parsedLocal)) return parsedLocal;
        } catch {}
      }

      return [];
    } catch (err) {
      console.warn('[financeiroService.getContasReceber] Fallback:', err);
      const rawLocal = typeof window !== 'undefined' ? window.localStorage.getItem('focus_app_focus_contas_receber') : null;
      if (rawLocal) {
        try {
          const parsedLocal = JSON.parse(rawLocal);
          if (Array.isArray(parsedLocal)) return parsedLocal;
        } catch {}
      }
      return [];
    }
  },

  async saveContaReceber(titulo: TituloReceberDTO): Promise<TituloReceberDTO> {
    const validated = tituloReceberSchema.parse(titulo);
    const id = toValidUuid(validated.id);
    const validatedWithId = { ...validated, id };

    // Update local cache com proteção
    if (typeof window !== 'undefined') {
      ['focus_app_focus_contas_receber', 'focus_app_contas_receber'].forEach((key) => {
        try {
          const raw = window.localStorage.getItem(key);
          const current: TituloReceberDTO[] = raw ? JSON.parse(raw) : [];
          const updated = [validatedWithId, ...current.filter((c) => c.id !== id)];
          window.localStorage.setItem(key, JSON.stringify(updated));
        } catch {}
      });
    }

    const payload = {
      id,
      numero: validated.numero || `REC-${id.slice(0, 4).toUpperCase()}`,
      cliente_nome: validated.cliente || 'Cliente',
      cliente_id: toNullableValidUuid(validated.clienteId),
      descricao: validated.descricao || 'Recebimento de título',
      categoria: validated.categoria || 'Receita Operacional',
      valor_original: Number(validated.valorOriginal || 0),
      valor_recebido: Number(validated.valorRecebido || 0),
      data_emissao: validated.dataEmissao || new Date().toISOString().split('T')[0],
      data_vencimento: validated.dataVencimento || new Date().toISOString().split('T')[0],
      data_recebimento: validated.dataRecebimento || null,
      forma_pagamento: validated.formaPagamento || 'PIX',
      status: validated.status || 'Pendente',
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('contas_receber').upsert(payload, { onConflict: 'id' });
      if (error) {
        const safePayload = { ...payload, cliente_id: null };
        await supabase.from('contas_receber').upsert(safePayload, { onConflict: 'id' });
      }
    } catch (e: any) {
      console.warn('[financeiroService.saveContaReceber] Fallback upsert:', e?.message);
    }

    return validatedWithId;
  },

  async deleteContaReceber(id: string): Promise<void> {
    // 1. Limpeza imediata do LocalStorage
    if (typeof window !== 'undefined') {
      ['focus_app_focus_contas_receber', 'focus_app_contas_receber', 'focus_contas_receber'].forEach((key) => {
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

    // 2. Deletar do Supabase
    try {
      await supabase.from('contas_receber').delete().eq('id', id);
    } catch (err: any) {
      console.warn('[financeiroService.deleteContaReceber] Warning:', err?.message);
    }
  },

  // ==========================================
  // CONTAS A PAGAR
  // ==========================================
  async getContasPagar(): Promise<ContaPagarDTO[]> {
    try {
      // 1. Buscar na tabela relacional 'contas_pagar'
      const { data, error } = await supabase
        .from('contas_pagar')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (!error && Array.isArray(data)) {
        const mapped = data.map((item: any) => {
          const valorOrig = Number(item.valor_original ?? item.valorOriginal ?? item.valor ?? 0) || 0;
          const valorPg = Number(item.valor_pago ?? item.valorPago ?? 0) || 0;
          const saldoCalculado = Number(item.saldo ?? (valorOrig - valorPg)) || 0;
          const vencimento = item.data_vencimento || item.dataVencimento || item.vencimento || new Date().toISOString().split('T')[0];

          return {
            id: String(item.id || crypto.randomUUID()),
            numero: item.numero || item.codigo || `PAG-${String(item.id || '').slice(0, 4).toUpperCase()}`,
            fornecedor: item.fornecedor_nome || item.fornecedor || item.fornecedorNome || 'Fornecedor',
            fornecedorId: item.fornecedor_id || item.fornecedorId,
            descricao: item.descricao || 'Despesa operacional',
            categoria: item.categoria || 'Despesa Operacional',
            valorOriginal: valorOrig,
            valorPago: valorPg,
            saldo: saldoCalculado,
            dataEmissao: item.data_emissao || item.dataEmissao || new Date().toISOString().split('T')[0],
            dataVencimento: vencimento,
            dataPagamento: item.data_pagamento || item.dataPagamento,
            formaPagamento: item.forma_pagamento || item.formaPagamento || 'Boleto',
            status: item.status || 'Pendente',
            responsavel: item.responsavel || 'Administrador',
            ultimaAtualizacao: item.updated_at || item.ultimaAtualizacao || new Date().toISOString(),
            historico: Array.isArray(item.historico) ? item.historico : [],
            parcelas: Array.isArray(item.parcelas) ? item.parcelas : [],
            recorrente: Boolean(item.recorrente),
          };
        });

        // Sincronizar cache local com proteção contra quota
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem('focus_app_focus_contas_pagar', JSON.stringify(mapped));
          } catch {
            // Silently ignore quota exceeded
          }
        }

        return mapped;
      }

      // 2. Fallback de cache local se offline
      const rawLocal = typeof window !== 'undefined' ? window.localStorage.getItem('focus_app_focus_contas_pagar') : null;
      if (rawLocal) {
        try {
          const parsedLocal = JSON.parse(rawLocal);
          if (Array.isArray(parsedLocal)) return parsedLocal;
        } catch {}
      }

      return [];
    } catch (err) {
      console.warn('[financeiroService.getContasPagar] Fallback:', err);
      const rawLocal = typeof window !== 'undefined' ? window.localStorage.getItem('focus_app_focus_contas_pagar') : null;
      if (rawLocal) {
        try {
          const parsedLocal = JSON.parse(rawLocal);
          if (Array.isArray(parsedLocal)) return parsedLocal;
        } catch {}
      }
      return [];
    }
  },

  async saveContaPagar(conta: ContaPagarDTO): Promise<ContaPagarDTO> {
    const validated = contaPagarSchema.parse(conta);
    const id = toValidUuid(validated.id);
    const validatedWithId = { ...validated, id };

    // Update local cache
    if (typeof window !== 'undefined') {
      ['focus_app_focus_contas_pagar', 'focus_app_contas_pagar'].forEach((key) => {
        try {
          const raw = window.localStorage.getItem(key);
          const current: ContaPagarDTO[] = raw ? JSON.parse(raw) : [];
          const updated = [validatedWithId, ...current.filter((c) => c.id !== id)];
          window.localStorage.setItem(key, JSON.stringify(updated));
        } catch {}
      });
    }

    const payload = {
      id,
      numero: validated.numero || `PAG-${id.slice(0, 4).toUpperCase()}`,
      fornecedor_nome: validated.fornecedor || 'Fornecedor',
      fornecedor_id: toNullableValidUuid(validated.fornecedorId),
      descricao: validated.descricao || 'Despesa operacional',
      categoria: validated.categoria || 'Despesa Operacional',
      valor_original: Number(validated.valorOriginal || 0),
      valor_pago: Number(validated.valorPago || 0),
      data_emissao: validated.dataEmissao || new Date().toISOString().split('T')[0],
      data_vencimento: validated.dataVencimento || new Date().toISOString().split('T')[0],
      data_pagamento: validated.dataPagamento || null,
      forma_pagamento: validated.formaPagamento || 'Boleto',
      status: validated.status || 'Pendente',
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from('contas_pagar').upsert(payload);
    } catch (e: any) {
      console.warn('[financeiroService.saveContaPagar] Fallback upsert:', e?.message);
    }

    return validatedWithId;
  },

  async deleteContaPagar(id: string): Promise<void> {
    // 1. Limpeza imediata do LocalStorage
    if (typeof window !== 'undefined') {
      ['focus_app_focus_contas_pagar', 'focus_app_contas_pagar', 'focus_contas_pagar'].forEach((key) => {
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

    // 2. Deletar do Supabase
    try {
      await supabase.from('contas_pagar').delete().eq('id', id);
    } catch (err: any) {
      console.warn('[financeiroService.deleteContaPagar] Warning:', err?.message);
    }
  },
};
