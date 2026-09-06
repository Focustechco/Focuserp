import { useLocalStorageState } from '@/hooks/useDataStore';
import { Projeto } from '../types';
import { EventoProjeto, StatusEventoProjeto } from './types';

export function useProjetosAgenda() {
  const { data: projetos } = useLocalStorageState<Projeto>('focus_projetos');
  const {
    data: customEvents,
    addItem: addCustomEvent,
    updateItem: updateCustomEvent,
    deleteItem: deleteCustomEvent,
  } = useLocalStorageState<EventoProjeto>('focus_projetos_agenda_custom');

  const todayStr = new Date().toISOString().split('T')[0];

  // Mapeia automaticamente as datas dos Projetos cadastrados
  const mappedProjectEvents: EventoProjeto[] = [];

  projetos.forEach((p) => {
    // 1. Evento de Kickoff / Início
    if (p.dataInicio) {
      mappedProjectEvents.push({
        id: `evt-start-${p.id}`,
        titulo: `Kickoff: ${p.nome}`,
        tipo: 'Kickoff',
        data: p.dataInicio.split('T')[0],
        projetoId: p.id,
        projetoNome: p.nome,
        responsavel: p.responsavelPrincipal,
        status: p.status === 'Concluído' ? 'Concluído' : p.dataInicio.split('T')[0] <= todayStr ? 'Concluído' : 'Previsto',
        prioridade: p.prioridade,
        observacoes: `Início do projeto [${p.codigo}] - Cliente: ${p.idCliente || 'N/A'}`,
        isAutomatico: true,
      });
    }

    // 2. Evento de Entrega Final
    const dataEntrega = p.dataFinal || (p as any).dataPrevisaoFim || (p as any).data_previsao_fim || (p as any).dataFim;
    if (dataEntrega) {
      const isConcluido = p.status === 'Concluído';
      const dateStr = dataEntrega.split('T')[0];
      const isAtrasado = !isConcluido && dateStr < todayStr;
      let statusMapped: StatusEventoProjeto = 'Previsto';
      if (isConcluido) statusMapped = 'Concluído';
      else if (isAtrasado) statusMapped = 'Atrasado';
      else statusMapped = 'Em Andamento';

      mappedProjectEvents.push({
        id: `evt-end-${p.id}`,
        titulo: `Entrega do Projeto: ${p.nome}`,
        tipo: 'Entrega de Projeto',
        data: dateStr,
        projetoId: p.id,
        projetoNome: p.nome,
        responsavel: p.responsavelPrincipal,
        status: statusMapped,
        prioridade: isAtrasado ? 'Crítica' : p.prioridade,
        observacoes: `Prazo final contratado. Progresso atual: ${p.progressoGlobal || 0}%`,
        isAutomatico: true,
      });
    }
  });

  const todosEventos: EventoProjeto[] = [...mappedProjectEvents, ...customEvents].sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
  );

  const addEventoCustomizado = (evt: Omit<EventoProjeto, 'id' | 'isAutomatico'>) => {
    const newEvt: EventoProjeto = {
      ...evt,
      id: `evt-custom-prj-${Date.now()}`,
      isAutomatico: false,
    };
    addCustomEvent(newEvt);
  };

  return {
    eventos: todosEventos,
    projetos,
    addEventoCustomizado,
    updateCustomEvent,
    deleteCustomEvent,
  };
}
