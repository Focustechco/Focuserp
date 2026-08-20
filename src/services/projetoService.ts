import { supabase } from '@/lib/supabaseClient';
import { projetoSchema, ProjetoDTO } from '@/schemas/projetoSchema';
import { safeSetItem, safeGetItem, safeRemoveItem } from '@/lib/safeStorage';

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
 * Service de dados para o módulo de Projetos com persistência resiliente.
 */
export const projetoService = {
  async getProjetos(): Promise<ProjetoDTO[]> {
    // 1. Ler do cache local primeiro
    let localProjetos: ProjetoDTO[] = [];
    try {
      const rawLocal = safeGetItem('focus_app_focus_projetos') || safeGetItem('focus_projetos');
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localProjetos = parsed;
        }
      }
    } catch {}

    // 2. Buscar no Supabase
    try {
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

        // Atualizar cache local de forma segura
        safeSetItem('focus_app_focus_projetos', JSON.stringify(cloudProjetos));

        return cloudProjetos;
      }
    } catch {}

    return localProjetos;
  },

  async saveProjeto(projeto: ProjetoDTO): Promise<ProjetoDTO> {
    const validated = projetoSchema.parse(projeto);
    const validId = toValidUuid(validated.id);
    const finalProjeto: ProjetoDTO = { ...validated, id: validId };

    // 1. Gravar imediatamente no LocalStorage
    try {
      const rawLocal = safeGetItem('focus_app_focus_projetos') || safeGetItem('focus_projetos');
      const list: ProjetoDTO[] = rawLocal ? JSON.parse(rawLocal) : [];
      const filtered = list.filter(p => p.id !== validId);
      const updated = [finalProjeto, ...filtered];
      safeSetItem('focus_app_focus_projetos', JSON.stringify(updated));
      safeSetItem('focus_projetos', JSON.stringify(updated));
    } catch {}

    // 2. Sincronizar com Supabase
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
    } catch {}

    return finalProjeto;
  },

  async deleteProjeto(id: string): Promise<void> {
    try {
      const rawLocal = safeGetItem('focus_app_focus_projetos');
      if (rawLocal) {
        const list: ProjetoDTO[] = JSON.parse(rawLocal);
        const filtered = list.filter(p => p.id !== id);
        safeSetItem('focus_app_focus_projetos', JSON.stringify(filtered));
        safeSetItem('focus_projetos', JSON.stringify(filtered));
      }
    } catch {}

    try {
      if (isValidUuid(id)) {
        await supabase.from('projetos').delete().eq('id', id);
      }
    } catch {}
  },
};
