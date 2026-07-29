import { supabase } from '@/lib/supabaseClient';
import { fornecedorSchema, FornecedorDTO } from '@/schemas/fornecedorSchema';

export const fornecedorService = {
  /**
   * Buscar todos os fornecedores
   */
  async getFornecedores(): Promise<FornecedorDTO[]> {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => {
          const mapped = {
            id: item.id,
            tenantId: item.tenant_id,
            codigo: item.codigo || `FOR-${item.id?.slice(0, 4)}`,
            razaoSocial: item.razao_social || item.name || 'Fornecedor',
            nomeFantasia: item.nome_fantasia || item.razao_social || 'Fornecedor',
            cnpj: item.cnpj || '00.000.000/0001-00',
            email: item.email || '',
            telefone: item.telefone || '',
            categoria: item.categoria || 'Geral',
            status: item.status === 'Inativo' ? 'Inativo' : 'Ativo',
            cep: item.cep,
            logradouro: item.logradouro,
            numero: item.numero,
            complemento: item.complemento,
            bairro: item.bairro,
            cidade: item.cidade || 'São Paulo',
            estado: item.estado || 'SP',
            pais: item.pais || 'Brasil',
            observacoes: item.observacoes,
            created_at: item.created_at,
            updated_at: item.updated_at,
          };
          const parsed = fornecedorSchema.safeParse(mapped);
          if (parsed.success) {
            return parsed.data;
          }
          console.error(`[fornecedorService.getFornecedores] Falha na validação do fornecedor ${item.id}:`, parsed.error.format());
          return null;
        }).filter((item): item is FornecedorDTO => item !== null);
      }

      // Fallback LocalStorage
      const rawLocal = typeof window !== 'undefined' ? window.localStorage.getItem('focus_fornecedores') : null;
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed)) return parsed;
      }

      return [];
    } catch (err) {
      console.error('[fornecedorService.getFornecedores] Erro ao buscar fornecedores:', err);
      return [];
    }
  },

  /**
   * Salvar ou atualizar fornecedor
   */
  async saveFornecedor(fornecedor: FornecedorDTO): Promise<FornecedorDTO> {
    const validated = fornecedorSchema.parse(fornecedor);
    const id = validated.id || crypto.randomUUID();

    const payload = {
      id,
      tenant_id: validated.tenantId,
      codigo: validated.codigo || `FOR-${id.slice(0, 6).toUpperCase()}`,
      razao_social: validated.razaoSocial,
      nome_fantasia: validated.nomeFantasia,
      cnpj: validated.cnpj,
      email: validated.email,
      telefone: validated.telefone,
      categoria: validated.categoria,
      status: validated.status,
      cep: validated.cep,
      logradouro: validated.logradouro,
      numero: validated.numero,
      complemento: validated.complemento,
      bairro: validated.bairro,
      cidade: validated.cidade,
      estado: validated.estado,
      pais: validated.pais,
      observacoes: validated.observacoes,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('fornecedores').upsert(payload);
    if (error) {
      console.error('[fornecedorService.saveFornecedor] Erro ao salvar fornecedor:', error);
      throw new Error(`Falha ao salvar fornecedor: ${error.message}`);
    }

    return { ...validated, id };
  },

  /**
   * Excluir fornecedor por ID
   */
  async deleteFornecedor(id: string): Promise<void> {
    const { error } = await supabase.from('fornecedores').delete().eq('id', id);
    if (error) {
      console.error('[fornecedorService.deleteFornecedor] Erro ao deletar fornecedor:', error);
      throw new Error(`Falha ao deletar fornecedor: ${error.message}`);
    }
  }
};
