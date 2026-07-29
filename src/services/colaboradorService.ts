import { supabase } from '@/lib/supabaseClient';
import { colaboradorSchema, ColaboradorDTO } from '@/schemas/colaboradorSchema';

export const colaboradorService = {
  /**
   * Buscar todos os colaboradores
   */
  async getColaboradores(): Promise<ColaboradorDTO[]> {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => {
          const mapped = {
            id: item.id,
            tenantId: item.tenant_id,
            nomeCompleto: item.nome_completo || item.nome || 'Colaborador',
            cpf: item.cpf || '',
            email: item.email || '',
            cargo: item.cargo || 'Colaborador',
            departamento: item.departamento || 'Geral',
            salarioBase: Number(item.salario_base || item.salario || 0),
            dataAdmissao: item.data_admissao,
            status: item.status || 'Ativo',
            created_at: item.created_at,
            updated_at: item.updated_at,
          };
          const parsed = colaboradorSchema.safeParse(mapped);
          if (parsed.success) {
            return parsed.data;
          }
          console.error(`[colaboradorService.getColaboradores] Falha na validação do colaborador ${item.id}:`, parsed.error.format());
          return null;
        }).filter((item): item is ColaboradorDTO => item !== null);
      }

      // Fallback LocalStorage
      const rawLocal = typeof window !== 'undefined' ? window.localStorage.getItem('focus_rh_colaboradores') : null;
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed)) return parsed;
      }

      return [];
    } catch (err) {
      console.error('[colaboradorService.getColaboradores] Erro ao buscar colaboradores:', err);
      return [];
    }
  },

  /**
   * Salvar ou atualizar colaborador
   */
  async saveColaborador(colaborador: ColaboradorDTO): Promise<ColaboradorDTO> {
    const validated = colaboradorSchema.parse(colaborador);
    const id = validated.id || crypto.randomUUID();

    const payload = {
      id,
      tenant_id: validated.tenantId,
      nome_completo: validated.nomeCompleto,
      cpf: validated.cpf,
      email: validated.email,
      cargo: validated.cargo,
      departamento: validated.departamento,
      salario_base: validated.salarioBase,
      data_admissao: validated.dataAdmissao,
      status: validated.status,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('colaboradores').upsert(payload);
    if (error) {
      console.error('[colaboradorService.saveColaborador] Erro ao salvar colaborador:', error);
      throw new Error(`Falha ao salvar colaborador: ${error.message}`);
    }

    return { ...validated, id };
  },

  /**
   * Excluir colaborador por ID
   */
  async deleteColaborador(id: string): Promise<void> {
    const { error } = await supabase.from('colaboradores').delete().eq('id', id);
    if (error) {
      console.error('[colaboradorService.deleteColaborador] Erro ao deletar colaborador:', error);
      throw new Error(`Falha ao deletar colaborador: ${error.message}`);
    }
  }
};
