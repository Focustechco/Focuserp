import { supabase } from '@/lib/supabaseClient';
import {
  tituloReceberSchema,
  contaPagarSchema,
  TituloReceberDTO,
  ContaPagarDTO,
} from '@/schemas/financeiroSchema';

/**
 * Service de dados para o módulo Financeiro (Contas a Receber e Contas a Pagar).
 */
export const financeiroService = {
  // ==========================================
  // CONTAS A RECEBER
  // ==========================================
  async getContasReceber(): Promise<TituloReceberDTO[]> {
    try {
      // 1. Tentar buscar na tabela relacional 'contas_receber'
      const { data, error } = await supabase
        .from('contas_receber')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => {
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
          };
        });
      }

      // 2. Fallback de cache local
      const rawLocal = typeof window !== 'undefined' ? window.localStorage.getItem('focus_app_focus_contas_receber') : null;
      if (rawLocal) {
        const parsedLocal = JSON.parse(rawLocal);
        if (Array.isArray(parsedLocal)) return parsedLocal;
      }

      return [];
    } catch (err) {
      console.error('[financeiroService.getContasReceber] Erro:', err);
      return [];
    }
  },

  async saveContaReceber(titulo: TituloReceberDTO): Promise<TituloReceberDTO> {
    const validated = tituloReceberSchema.parse(titulo);
    const id = validated.id || crypto.randomUUID();

    const payload = {
      id,
      numero: validated.numero,
      cliente_nome: validated.cliente,
      cliente_id: validated.clienteId || null,
      descricao: validated.descricao,
      categoria: validated.categoria,
      valor_original: validated.valorOriginal,
      valor_recebido: validated.valorRecebido,
      data_emissao: validated.dataEmissao,
      data_vencimento: validated.dataVencimento,
      data_recebimento: validated.dataRecebimento || null,
      forma_pagamento: validated.formaPagamento,
      status: validated.status,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('contas_receber').upsert(payload);
    if (error) {
      console.warn('[financeiroService.saveContaReceber] Fallback upsert:', error.message);
    }

    return { ...validated, id };
  },

  async deleteContaReceber(id: string): Promise<void> {
    const { error } = await supabase.from('contas_receber').delete().eq('id', id);
    if (error) {
      console.warn('[financeiroService.deleteContaReceber] Erro ao deletar:', error.message);
    }
  },

  // ==========================================
  // CONTAS A PAGAR
  // ==========================================
  async getContasPagar(): Promise<ContaPagarDTO[]> {
    try {
      // 1. Tentar buscar na tabela relacional 'contas_pagar'
      const { data, error } = await supabase
        .from('contas_pagar')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => {
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
      }

      // 2. Fallback de cache local
      const rawLocal = typeof window !== 'undefined' ? window.localStorage.getItem('focus_app_focus_contas_pagar') : null;
      if (rawLocal) {
        const parsedLocal = JSON.parse(rawLocal);
        if (Array.isArray(parsedLocal)) return parsedLocal;
      }

      return [];
    } catch (err) {
      console.error('[financeiroService.getContasPagar] Erro:', err);
      return [];
    }
  },

  async saveContaPagar(conta: ContaPagarDTO): Promise<ContaPagarDTO> {
    const validated = contaPagarSchema.parse(conta);
    const id = validated.id || crypto.randomUUID();

    const payload = {
      id,
      numero: validated.numero,
      fornecedor_nome: validated.fornecedor,
      fornecedor_id: validated.fornecedorId || null,
      descricao: validated.descricao,
      categoria: validated.categoria,
      valor_original: validated.valorOriginal,
      valor_pago: validated.valorPago,
      data_emissao: validated.dataEmissao,
      data_vencimento: validated.dataVencimento,
      data_pagamento: validated.dataPagamento || null,
      forma_pagamento: validated.formaPagamento,
      status: validated.status,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('contas_pagar').upsert(payload);
    if (error) {
      console.warn('[financeiroService.saveContaPagar] Fallback upsert:', error.message);
    }

    return { ...validated, id };
  },

  async deleteContaPagar(id: string): Promise<void> {
    const { error } = await supabase.from('contas_pagar').delete().eq('id', id);
    if (error) {
      console.warn('[financeiroService.deleteContaPagar] Erro ao deletar:', error.message);
    }
  },
};
