import { supabase } from '@/lib/supabaseClient';
import { colaboradorSchema, ColaboradorDTO } from '@/schemas/colaboradorSchema';

function toValidUuid(id?: string | null): string {
  if (!id || typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return crypto.randomUUID();
  }
  return id;
}

/**
 * Service de dados reais para o módulo de Recursos Humanos (Colaboradores).
 */
export const colaboradorService = {
  async getColaboradores(): Promise<ColaboradorDTO[]> {
    try {
      // 1. Tentar buscar na tabela relacional 'colaboradores' no Supabase
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const items = data.map((item: any) => ({
          id: item.id,
          matricula: item.matricula || `MAT-${String(item.id).slice(0, 4).toUpperCase()}`,
          nomeCompleto: item.nome || item.nomeCompleto || 'Colaborador',
          cpf: item.cpf || '000.000.000-00',
          emailCorporativo: item.email || item.emailCorporativo || 'colaborador@empresa.com',
          cargo: item.cargo || 'Colaborador',
          departamento: item.departamento || 'Tecnologia',
          dataAdmissao: item.data_admissao || item.dataAdmissao || new Date().toISOString().split('T')[0],
          tipoContrato: item.tipo_contrato || item.tipoContrato || 'CLT',
          regime: item.regime || 'Híbrido',
          salarioBase: Number(item.salario_base || item.salarioBase || 0),
          status: item.status || 'Ativo',
          metodoPagamento: item.metodo_pagamento || item.metodoPagamento || { formaPagamento: 'PIX' },
          documentos: item.documentos || [],
        }));
        return items;
      }

      // 2. Fallback de cache local dinâmico
      if (typeof window !== 'undefined') {
        const rawLocal = window.localStorage.getItem('focus_app_focus_rh_colaboradores') || window.localStorage.getItem('focus_rh_colaboradores');
        if (rawLocal) {
          const parsedLocal = JSON.parse(rawLocal);
          if (Array.isArray(parsedLocal)) return parsedLocal;
        }
      }

      return [];
    } catch (err) {
      console.error('[colaboradorService.getColaboradores] Erro:', err);
      return [];
    }
  },

  async saveColaborador(colaborador: ColaboradorDTO): Promise<ColaboradorDTO> {
    const validId = toValidUuid(colaborador.id);
    const validated = colaboradorSchema.parse({ ...colaborador, id: validId });

    const payload = {
      id: validId,
      matricula: validated.matricula || `MAT-${validId.slice(0, 4).toUpperCase()}`,
      nome: validated.nomeCompleto,
      cpf: validated.cpf,
      email: validated.emailCorporativo,
      cargo: validated.cargo,
      departamento: validated.departamento,
      data_admissao: validated.dataAdmissao,
      tipo_contrato: validated.tipoContrato,
      regime: validated.regime,
      salario_base: validated.salarioBase,
      status: validated.status,
      metodo_pagamento: validated.metodoPagamento,
      documentos: validated.documentos,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('colaboradores').upsert(payload);
    if (error) {
      console.warn('[colaboradorService.saveColaborador] Supabase upsert note:', error.message);
    }

    const savedColab: ColaboradorDTO = { ...validated, id: validId };

    if (typeof window !== 'undefined') {
      try {
        const keys = ['focus_app_focus_rh_colaboradores', 'focus_rh_colaboradores'];
        keys.forEach((key) => {
          const rawLocal = window.localStorage.getItem(key);
          const current: ColaboradorDTO[] = rawLocal ? JSON.parse(rawLocal) : [];
          const updated = [savedColab, ...current.filter((c) => c.id !== validId)];
          window.localStorage.setItem(key, JSON.stringify(updated));
        });
      } catch (err) {
        console.warn('Erro ao atualizar cache local de colaboradores:', err);
      }
    }

    return savedColab;
  },

  async deleteColaborador(id: string): Promise<void> {
    if (!id) return;

    const { error } = await supabase.from('colaboradores').delete().eq('id', id);
    if (error) {
      console.warn('[colaboradorService.deleteColaborador] Erro ao deletar no Supabase:', error.message);
    }

    if (typeof window !== 'undefined') {
      try {
        const keys = ['focus_app_focus_rh_colaboradores', 'focus_rh_colaboradores'];
        keys.forEach((key) => {
          const rawLocal = window.localStorage.getItem(key);
          if (rawLocal) {
            const current: ColaboradorDTO[] = JSON.parse(rawLocal);
            const filtered = current.filter((c) => c.id !== id);
            window.localStorage.setItem(key, JSON.stringify(filtered));
          }
        });
      } catch (err) {
        console.warn('Erro ao atualizar cache local de colaboradores:', err);
      }
    }
  },
};
