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
 * Conectado exclusivamente ao Banco de Dados Real (Supabase).
 */
export const colaboradorService = {
  async getColaboradores(): Promise<ColaboradorDTO[]> {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[colaboradorService.getColaboradores] Supabase Error:', error.message);
        return [];
      }

      if (data && data.length > 0) {
        return data.map((item: any) => ({
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
      }

      return [];
    } catch (err) {
      console.error('[colaboradorService.getColaboradores] Erro de conexão:', err);
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
      cpf: validated.cpf || null,
      email: validated.emailCorporativo || null,
      cargo: validated.cargo || 'Colaborador',
      departamento: validated.departamento || 'Geral',
      data_admissao: validated.dataAdmissao || new Date().toISOString().split('T')[0],
      tipo_contrato: validated.tipoContrato || 'CLT',
      status: validated.status || 'Ativo',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('colaboradores').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('[colaboradorService.saveColaborador] Supabase upsert note:', error.message);
    }

    // Atualizar cache local
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('focus_colaboradores');
        const list: ColaboradorDTO[] = raw ? JSON.parse(raw) : [];
        const updated = [{ ...validated, id: validId }, ...list.filter(c => c.id !== validId)];
        window.localStorage.setItem('focus_colaboradores', JSON.stringify(updated));
        window.localStorage.setItem('focus_app_focus_colaboradores', JSON.stringify(updated));
        window.dispatchEvent(new Event('focus_storage_update'));
      } catch {}
    }

    return { ...validated, id: validId };
  },

  async deleteColaborador(id: string): Promise<void> {
    if (!id) return;

    try {
      const { error } = await supabase.from('colaboradores').delete().eq('id', id);
      if (error) {
        console.warn('[colaboradorService.deleteColaborador] Erro ao deletar no Supabase:', error.message);
      }
    } catch {}

    // Limpar caches locais
    if (typeof window !== 'undefined') {
      try {
        ['focus_colaboradores', 'focus_app_focus_colaboradores', 'focus_app_colaboradores'].forEach(key => {
          const raw = window.localStorage.getItem(key);
          if (raw) {
            const list: ColaboradorDTO[] = JSON.parse(raw);
            const filtered = list.filter(c => c.id !== id);
            window.localStorage.setItem(key, JSON.stringify(filtered));
          }
        });
        window.dispatchEvent(new Event('focus_storage_update'));
      } catch {}
    }
  },
};
