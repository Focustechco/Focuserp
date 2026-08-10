import { supabase } from '@/lib/supabaseClient';
import { colaboradorSchema, ColaboradorDTO } from '@/schemas/colaboradorSchema';

/**
 * Service de dados para o módulo de Recursos Humanos (Colaboradores).
 */
export const colaboradorService = {
  async getColaboradores(): Promise<ColaboradorDTO[]> {
    try {
      // 1. Tentar buscar na tabela relacional 'colaboradores' ou 'users'
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => {
          const parsed = colaboradorSchema.safeParse({
            id: item.id,
            matricula: item.matricula || `MAT-${item.id.slice(0, 4).toUpperCase()}`,
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
          });

          return parsed.success ? parsed.data : (item as ColaboradorDTO);
        });
      }

      // 2. Fallback de cache local
      const rawLocal = typeof window !== 'undefined' ? window.localStorage.getItem('focus_app_focus_rh_colaboradores') : null;
      if (rawLocal) {
        const parsedLocal = JSON.parse(rawLocal);
        if (Array.isArray(parsedLocal)) return parsedLocal;
      }

      return [];
    } catch (err) {
      console.error('[colaboradorService.getColaboradores] Erro:', err);
      return [];
    }
  },

  async saveColaborador(colaborador: ColaboradorDTO): Promise<ColaboradorDTO> {
    const validated = colaboradorSchema.parse(colaborador);
    const id = validated.id || crypto.randomUUID();

    const payload = {
      id,
      matricula: validated.matricula,
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
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('colaboradores').upsert(payload);
    if (error) {
      console.warn('[colaboradorService.saveColaborador] Fallback upsert:', error.message);
    }

    return { ...validated, id };
  },

  async deleteColaborador(id: string): Promise<void> {
    const { error } = await supabase.from('colaboradores').delete().eq('id', id);
    if (error) {
      console.warn('[colaboradorService.deleteColaborador] Erro ao deletar:', error.message);
    }
  },
};
