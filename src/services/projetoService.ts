import { supabase } from '@/lib/supabaseClient';
import { projetoSchema, ProjetoDTO } from '@/schemas/projetoSchema';

function toValidUuid(idStr?: string): string {
  if (!idStr) return crypto.randomUUID();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(idStr)) return idStr;
  return crypto.randomUUID();
}

function isValidUuid(idStr?: string): boolean {
  if (!idStr) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);
}

/**
 * Service de dados para o módulo de Projetos.
 */
export const projetoService = {
  async getProjetos(): Promise<ProjetoDTO[]> {
    try {
      // 1. Buscar do cache local primeiro para resposta instantânea
      let localProjetos: ProjetoDTO[] = [];
      if (typeof window !== 'undefined') {
        const rawLocal = window.localStorage.getItem('focus_app_focus_projetos') || window.localStorage.getItem('focus_projetos');
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localProjetos = parsed;
          }
        }
      }

      // 2. Buscar na tabela relacional 'projetos' do Supabase
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const cloudProjetos = data.map((item: any) => {
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

        // Atualizar cache local
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('focus_app_focus_projetos', JSON.stringify(cloudProjetos));
        }

        return cloudProjetos;
      }

      return localProjetos;
    } catch (err) {
      console.warn('[projetoService.getProjetos] Usando fallback local:', err);
      if (typeof window !== 'undefined') {
        const rawLocal = window.localStorage.getItem('focus_app_focus_projetos');
        if (rawLocal) return JSON.parse(rawLocal);
      }
      return [];
    }
  },

  async saveProjeto(projeto: ProjetoDTO): Promise<ProjetoDTO> {
    const validated = projetoSchema.parse(projeto);
    const validId = toValidUuid(validated.id);
    const finalProjeto: ProjetoDTO = { ...validated, id: validId };

    // 1. Persistência local instantânea
    if (typeof window !== 'undefined') {
      try {
        const rawLocal = window.localStorage.getItem('focus_app_focus_projetos');
        const list: ProjetoDTO[] = rawLocal ? JSON.parse(rawLocal) : [];
        const filtered = list.filter(p => p.id !== validId);
        const updated = [finalProjeto, ...filtered];
        window.localStorage.setItem('focus_app_focus_projetos', JSON.stringify(updated));
        window.localStorage.setItem('focus_projetos', JSON.stringify(updated));
      } catch (e) {
        console.warn('[projetoService.saveProjeto] LocalStorage warn:', e);
      }
    }

    // 2. Persistência na nuvem Supabase com payload seguro (UUID válido)
    try {
      const payload: any = {
        id: validId,
        codigo: finalProjeto.codigo,
        nome: finalProjeto.nome,
        tipo: finalProjeto.tipo,
        categoria: finalProjeto.categoria,
        responsavel_principal: finalProjeto.responsavelPrincipal,
        prioridade: finalProjeto.prioridade,
        status: finalProjeto.status,
        data_inicio: finalProjeto.dataInicio,
        data_fim_prevista: finalProjeto.dataFinal,
        descricao: finalProjeto.descricaoGeral,
        valor_contratado: finalProjeto.valorContratado,
        valor_recebido: finalProjeto.valorRecebido,
        progresso_global: finalProjeto.progressoGlobal,
        horas_planejadas: finalProjeto.horasPlanejadas,
        horas_realizadas: finalProjeto.horasRealizadas,
        updated_at: new Date().toISOString(),
      };

      if (finalProjeto.idCliente && isValidUuid(finalProjeto.idCliente)) {
        payload.cliente_id = finalProjeto.idCliente;
      }

      await supabase.from('projetos').upsert(payload);
    } catch (err: any) {
      console.warn('[projetoService.saveProjeto] Supabase sync fallback:', err?.message);
    }

    return finalProjeto;
  },

  async deleteProjeto(id: string): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        const rawLocal = window.localStorage.getItem('focus_app_focus_projetos');
        if (rawLocal) {
          const list: ProjetoDTO[] = JSON.parse(rawLocal);
          const filtered = list.filter(p => p.id !== id);
          window.localStorage.setItem('focus_app_focus_projetos', JSON.stringify(filtered));
          window.localStorage.setItem('focus_projetos', JSON.stringify(filtered));
        }
      } catch {}
    }

    try {
      if (isValidUuid(id)) {
        await supabase.from('projetos').delete().eq('id', id);
      }
    } catch {}
  },
};
