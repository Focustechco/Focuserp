import { supabase } from '@/lib/supabaseClient';
import { projetoSchema, ProjetoDTO } from '@/schemas/projetoSchema';

export const projetoService = {
  /**
   * Buscar todos os projetos
   */
  async getProjetos(): Promise<ProjetoDTO[]> {
    try {
      const { data, error } = await supabase
        .from('projetos')
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
          const valContratado = Number(item.valor_contratado || 0);
          const valRecebido = Number(item.valor_recebido || 0);
          const saldoRest = valContratado - valRecebido;

          const mapped = {
            id: item.id,
            tenantId: item.tenant_id,
            codigo: item.codigo,
            nome: item.nome,
            clienteId: item.cliente_id,
            clienteNome,
            idContrato: item.id_contrato,
            tipo: item.tipo || 'Desenvolvimento',
            categoria: item.categoria,
            responsavelPrincipal: item.responsavel_principal || '',
            orcamentoEstimado: Number(item.orcamento_estimado || valContratado),
            valorContratado: valContratado,
            valorRecebido: valRecebido,
            saldoRestante: saldoRest,
            progressoGlobal: Number(item.progresso_global || 0),
            prioridade: item.prioridade || 'Média',
            status: item.status || 'Planejamento',
            dataInicio: item.data_inicio,
            dataFinal: item.data_final,
            descricaoGeral: item.descricao_geral,
            horasPlanejadas: Number(item.horas_planejadas || 0),
            horasRealizadas: Number(item.horas_realizadas || 0),
            created_at: item.created_at,
            updated_at: item.updated_at,
          };
          const parsed = projetoSchema.safeParse(mapped);
          if (parsed.success) {
            return parsed.data;
          }
          console.error(`[projetoService.getProjetos] Falha na validação do projeto ${item.id}:`, parsed.error.format());
          return null;
        }).filter((item): item is ProjetoDTO => item !== null);
      }

      // Fallback LocalStorage
      const rawLocal = typeof window !== 'undefined' ? window.localStorage.getItem('focus_projetos') : null;
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed)) return parsed;
      }

      return [];
    } catch (err) {
      console.error('[projetoService.getProjetos] Erro ao buscar projetos:', err);
      return [];
    }
  },

  /**
   * Buscar projeto por ID
   */
  async getProjetoById(id: string): Promise<ProjetoDTO | null> {
    const projetos = await this.getProjetos();
    return projetos.find(p => p.id === id) || null;
  },

  /**
   * Salvar ou atualizar projeto
   */
  async saveProjeto(projeto: ProjetoDTO): Promise<ProjetoDTO> {
    const validated = projetoSchema.parse(projeto);
    const id = validated.id || crypto.randomUUID();

    const payload = {
      id,
      tenant_id: validated.tenantId,
      cliente_id: validated.clienteId,
      codigo: validated.codigo || `PRJ-${id.slice(0, 6).toUpperCase()}`,
      nome: validated.nome,
      id_contrato: validated.idContrato,
      tipo: validated.tipo,
      categoria: validated.categoria,
      responsavel_principal: validated.responsavelPrincipal,
      prioridade: validated.prioridade,
      status: validated.status,
      data_inicio: validated.dataInicio,
      data_final: validated.dataFinal,
      descricao_geral: validated.descricaoGeral,
      valor_contratado: validated.valorContratado,
      valor_recebido: validated.valorRecebido,
      progresso_global: validated.progressoGlobal,
      horas_planejadas: validated.horasPlanejadas,
      horas_realizadas: validated.horasRealizadas,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('projetos').upsert(payload);
    if (error) {
      console.error('[projetoService.saveProjeto] Erro ao salvar projeto:', error);
      throw new Error(`Falha ao salvar projeto: ${error.message}`);
    }

    return { ...validated, id };
  },

  /**
   * Excluir projeto por ID
   */
  async deleteProjeto(id: string): Promise<void> {
    const { error } = await supabase.from('projetos').delete().eq('id', id);
    if (error) {
      console.error('[projetoService.deleteProjeto] Erro ao deletar projeto:', error);
      throw new Error(`Falha ao deletar projeto: ${error.message}`);
    }
  },

  /**
   * Atualizar progresso percentual do projeto
   */
  async updateProgresso(id: string, progresso: number): Promise<ProjetoDTO> {
    const projeto = await this.getProjetoById(id);
    if (!projeto) {
      throw new Error(`Projeto ${id} não encontrado para atualização de progresso.`);
    }

    const progressoLimitado = Math.min(100, Math.max(0, progresso));
    const novoStatus = progressoLimitado >= 100 ? 'Concluído' : projeto.status === 'Planejamento' && progressoLimitado > 0 ? 'Em Andamento' : projeto.status;

    const projetoAtualizado: ProjetoDTO = {
      ...projeto,
      progressoGlobal: progressoLimitado,
      status: novoStatus,
    };

    return this.saveProjeto(projetoAtualizado);
  }
};
