import { supabase } from '@/lib/supabaseClient';
import { projetoSchema, ProjetoDTO } from '@/schemas/projetoSchema';

/**
 * Service de dados para o módulo de Projetos.
 */
export const projetoService = {
  async getProjetos(): Promise<ProjetoDTO[]> {
    try {
      // 1. Tentar buscar na tabela relacional 'projetos'
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => {
          const parsed = projetoSchema.safeParse({
            id: item.id,
            codigo: item.codigo || `PRJ-${item.id.slice(0, 4).toUpperCase()}`,
            nome: item.nome || 'Projeto Empresarial',
            idCliente: item.cliente_id || item.idCliente || 'Cliente',
            idContrato: item.contrato_id || item.idContrato,
            tipo: item.tipo || 'Software Sob Medida',
            categoria: item.categoria || 'Desenvolvimento',
            responsavelPrincipal: item.responsavel_principal || item.responsavelPrincipal || 'Gerente',
            prioridade: item.prioridade || 'Média',
            status: item.status || 'Planejamento',
            dataInicio: item.data_inicio || item.dataInicio || new Date().toISOString().split('T')[0],
            dataFinal: item.data_fim_prevista || item.dataFinal || new Date().toISOString().split('T')[0],
            descricaoGeral: item.descricao || item.descricaoGeral || '',
            valorContratado: Number(item.valor_contratado || item.valorContratado || 0),
            valorRecebido: Number(item.valor_recebido || item.valorRecebido || 0),
            saldoRestante: Number(item.saldo_restante || item.saldoRestante || 0),
            progressoGlobal: Number(item.progresso_global || item.progressoGlobal || 0),
            horasPlanejadas: Number(item.horas_planejadas || item.horasPlanejadas || 0),
            horasRealizadas: Number(item.horas_realizadas || item.horasRealizadas || 0),
            ultimaAtualizacao: item.updated_at || item.ultimaAtualizacao || new Date().toISOString(),
          });

          return parsed.success ? parsed.data : (item as ProjetoDTO);
        });
      }

      // 2. Fallback de cache local
      const rawLocal = typeof window !== 'undefined' ? window.localStorage.getItem('focus_app_focus_projetos') : null;
      if (rawLocal) {
        const parsedLocal = JSON.parse(rawLocal);
        if (Array.isArray(parsedLocal)) return parsedLocal;
      }

      return [];
    } catch (err) {
      console.error('[projetoService.getProjetos] Erro:', err);
      return [];
    }
  },

  async saveProjeto(projeto: ProjetoDTO): Promise<ProjetoDTO> {
    const validated = projetoSchema.parse(projeto);
    const id = validated.id || crypto.randomUUID();

    const payload = {
      id,
      codigo: validated.codigo,
      nome: validated.nome,
      cliente_id: validated.idCliente,
      tipo: validated.tipo,
      categoria: validated.categoria,
      responsavel_principal: validated.responsavelPrincipal,
      prioridade: validated.prioridade,
      status: validated.status,
      data_inicio: validated.dataInicio,
      data_fim_prevista: validated.dataFinal,
      descricao: validated.descricaoGeral,
      valor_contratado: validated.valorContratado,
      valor_recebido: validated.valorRecebido,
      progresso_global: validated.progressoGlobal,
      horas_planejadas: validated.horasPlanejadas,
      horas_realizadas: validated.horasRealizadas,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('projetos').upsert(payload);
    if (error) {
      console.warn('[projetoService.saveProjeto] Fallback upsert:', error.message);
    }

    return { ...validated, id };
  },

  async deleteProjeto(id: string): Promise<void> {
    const { error } = await supabase.from('projetos').delete().eq('id', id);
    if (error) {
      console.warn('[projetoService.deleteProjeto] Erro ao deletar:', error.message);
    }
  },
};
