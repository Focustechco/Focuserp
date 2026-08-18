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

    let { error } = await supabase.from('colaboradores').upsert(payload);
    if (error && error.message.includes('column')) {
      // Fallback: omit non-existent schema columns in database
      const basePayload = {
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
        updated_at: new Date().toISOString(),
      };
      const retry = await supabase.from('colaboradores').upsert(basePayload);
      error = retry.error;
    }

    if (error) {
      console.warn('[colaboradorService.saveColaborador] Supabase upsert note:', error.message);
    }

    return { ...validated, id: validId };
  },

  async deleteColaborador(id: string): Promise<void> {
    if (!id) return;

    const { error } = await supabase.from('colaboradores').delete().eq('id', id);
    if (error) {
      console.error('[colaboradorService.deleteColaborador] Erro ao deletar no Supabase:', error.message);
      throw new Error(`Erro ao excluir no banco de dados: ${error.message}`);
    }
  },
};
