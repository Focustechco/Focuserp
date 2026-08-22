import { useLocalStorageState } from "@/hooks/useDataStore";
import { EventoFinanceiro, StatusAgenda } from "./types";
import { TituloReceber } from "../contas-receber/types";
import { ContaPagar } from "../contas-pagar/types";
import { RecorrenciaFinanceira } from "../recorrencias/types";
import { getBrasiliaTodayIso, parseDateSafe } from "@/lib/dateUtils";

export interface ContratoItem {
  id: string;
  numeroContrato?: string;
  clienteNome?: string;
  valorTotal?: number;
  dataInicio?: string;
  dataVencimento?: string;
  status?: string;
}

export interface ProjetoItem {
  id: string;
  nome: string;
  valorContratado?: number;
  dataFinal?: string;
  status?: string;
}

export function useAgendaEvents() {
  const { data: contasReceber = [] } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: contasPagar = [] } = useLocalStorageState<ContaPagar>('focus_contas_pagar');
  const { data: contratos = [] } = useLocalStorageState<ContratoItem>('focus_contratos');
  const { data: projetos = [] } = useLocalStorageState<ProjetoItem>('focus_projetos');
  const { data: recorrencias = [] } = useLocalStorageState<RecorrenciaFinanceira>('focus_recorrencias');
  const { data: customEvents = [], addItem: addCustomItem } = useLocalStorageState<EventoFinanceiro>('focus_agenda_custom');

  // 1. Títulos Avulsos e Títulos Gerados do Contas a Receber
  const mappedReceber: EventoFinanceiro[] = contasReceber.map(c => {
    let statusMapped: StatusAgenda = 'Em Aberto';
    if (c.status === 'Recebido') statusMapped = 'Recebido';
    else if (c.status === 'Atrasado') statusMapped = 'Vencido';
    else if (c.status === 'Cancelado') statusMapped = 'Cancelado';

    return {
      id: `rec-${c.id}`,
      titulo: c.descricao ? `${c.cliente} - ${c.descricao}` : `Recebimento de ${c.cliente}`,
      categoria: 'Recebimento',
      data: c.dataVencimento || getBrasiliaTodayIso(),
      valor: c.valorOriginal || 0,
      entidadeVinculo: c.cliente,
      clienteId: c.clienteId,
      status: statusMapped,
      prioridade: c.status === 'Atrasado' ? 'Alta' : 'Média',
      moduloOrigem: 'Contas a Receber',
      linkOrigem: '/contas-a-receber',
      observacoes: c.observacoes || `Forma de Pagamento: ${c.formaPagamento || 'N/A'}`
    };
  });

  // 2. Projeção de Recorrências do Módulo Clientes / Recorrências no Calendário
  // Ex: Se cadastrou dia 10 do mês, projeta todos os dias 10 do ano
  const mappedRecorrencias: EventoFinanceiro[] = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const yearsToProject = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  const todayIso = getBrasiliaTodayIso();

  recorrencias.forEach(r => {
    if (!r || r.status === 'Encerrada') return;

    const dataInicioStr = r.dataInicio || `${currentYear}-01-01`;
    const dataInicio = parseDateSafe(dataInicioStr);
    const startYear = isNaN(dataInicio.getFullYear()) ? currentYear : dataInicio.getFullYear();
    const startMonth = isNaN(dataInicio.getMonth()) ? 0 : dataInicio.getMonth();
    const diaVenc = r.diaVencimento || 10;

    yearsToProject.forEach(year => {
      for (let month = 0; month < 12; month++) {
        // Verificar se deve gerar neste mês de acordo com a frequência
        let shouldGenerate = false;
        if (r.frequencia === 'Mensal' || !r.frequencia) {
          shouldGenerate = true;
        } else if (r.frequencia === 'Trimestral') {
          shouldGenerate = (month - startMonth) % 3 === 0;
        } else if (r.frequencia === 'Semestral') {
          shouldGenerate = (month - startMonth) % 6 === 0;
        } else if (r.frequencia === 'Anual') {
          shouldGenerate = month === startMonth;
        }

        if (!shouldGenerate) continue;

        const maxDaysInMonth = new Date(year, month + 1, 0).getDate();
        const targetDay = Math.min(diaVenc, maxDaysInMonth);
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;

        // Não projetar antes da data de início da recorrência
        if (dateStr < dataInicioStr.split('T')[0]) continue;

        // Verificar se já existe um título no contas a receber para este cliente nesta data
        const tituloExistente = contasReceber.find(c => 
          (c.clienteId === r.clientId || (c.cliente && c.cliente.toLowerCase() === (r.clientName || '').toLowerCase())) &&
          (c.dataVencimento === dateStr || (c.descricao && c.descricao.includes(r.descricao)))
        );

        let statusEvent: StatusAgenda = 'Em Aberto';
        if (tituloExistente) {
          if (tituloExistente.status === 'Recebido') statusEvent = 'Recebido';
          else if (tituloExistente.status === 'Atrasado') statusEvent = 'Vencido';
          else if (tituloExistente.status === 'Cancelado') statusEvent = 'Cancelado';
        } else {
          if (dateStr < todayIso) {
            statusEvent = 'Vencido';
          } else {
            statusEvent = 'Previsto';
          }
        }

        // Se já tiver um título exato renderizado no mappedReceber para este dia, evitamos duplicar ou enriquecemos como recorrência
        const duplicateIndex = mappedReceber.findIndex(m => 
          (m.clienteId === r.clientId || m.entidadeVinculo?.toLowerCase() === (r.clientName || '').toLowerCase()) &&
          m.data === dateStr
        );

        if (duplicateIndex !== -1) {
          // Marca o evento já existente como Recorrência
          mappedReceber[duplicateIndex].categoria = 'Recorrência';
          mappedReceber[duplicateIndex].titulo = `[Recorrência] ${r.clientName} - ${r.descricao || 'Mensalidade'}`;
          mappedReceber[duplicateIndex].observacoes = `Recorrência ${r.frequencia || 'Mensal'} (Todo dia ${diaVenc} do mês)`;
        } else {
          mappedRecorrencias.push({
            id: `rec-proj-${r.id}-${year}-${month + 1}`,
            titulo: `[Recorrência] ${r.clientName} - ${r.descricao || 'Mensalidade'}`,
            categoria: 'Recorrência',
            data: dateStr,
            valor: r.valor || 0,
            entidadeVinculo: r.clientName,
            clienteId: r.clientId,
            status: statusEvent,
            prioridade: 'Alta',
            moduloOrigem: 'Clientes',
            linkOrigem: '/clientes',
            observacoes: `Recorrência ${r.frequencia || 'Mensal'} (Dia ${diaVenc} do mês) • Próxima Cobrança: ${r.proximaCobranca || dateStr}`
          });
        }
      }
    });
  });

  // 3. Contas a Pagar
  const mappedPagar: EventoFinanceiro[] = contasPagar.map(c => {
    let statusMapped: StatusAgenda = 'Em Aberto';
    if (c.status === 'Pago') statusMapped = 'Pago';
    else if (c.status === 'Vencido') statusMapped = 'Vencido';
    else if (c.status === 'Cancelado') statusMapped = 'Cancelado';

    return {
      id: `pag-${c.id}`,
      titulo: c.descricao ? `${c.fornecedor} - ${c.descricao}` : `Pagamento a ${c.fornecedor}`,
      categoria: 'Pagamento',
      data: c.dataVencimento || new Date().toISOString(),
      valor: c.valorOriginal || 0,
      entidadeVinculo: c.fornecedor,
      status: statusMapped,
      prioridade: c.status === 'Vencido' ? 'Alta' : 'Média',
      moduloOrigem: 'Contas a Pagar',
      linkOrigem: '/contas-a-pagar',
      observacoes: c.observacoes || `Forma de Pagamento: ${c.formaPagamento || 'N/A'}`
    };
  });

  // 4. Contratos
  const mappedContratos: EventoFinanceiro[] = contratos.map(ct => ({
    id: `ct-${ct.id}`,
    titulo: ct.numeroContrato ? `Vencimento do Contrato ${ct.numeroContrato}` : `Contrato ${ct.clienteNome || ''}`,
    categoria: 'Contrato',
    data: ct.dataVencimento || ct.dataInicio || new Date().toISOString(),
    valor: ct.valorTotal || 0,
    entidadeVinculo: ct.clienteNome || 'Cliente',
    status: (ct.status === 'Ativo' ? 'Em Aberto' : 'Concluído') as StatusAgenda,
    prioridade: 'Média',
    moduloOrigem: 'Contratos',
    linkOrigem: '/contratos'
  }));

  // 5. Projetos
  const mappedProjetos: EventoFinanceiro[] = projetos.map(p => ({
    id: `prj-${p.id}`,
    titulo: `Entrega do Projeto: ${p.nome}`,
    categoria: 'Projeto',
    data: p.dataFinal || new Date().toISOString(),
    valor: p.valorContratado || 0,
    entidadeVinculo: p.nome,
    status: (p.status === 'Concluído' ? 'Concluído' : 'Em Aberto') as StatusAgenda,
    prioridade: 'Média',
    moduloOrigem: 'Projetos',
    linkOrigem: '/projetos'
  }));

  const allEvents: EventoFinanceiro[] = [
    ...mappedReceber,
    ...mappedRecorrencias,
    ...mappedPagar,
    ...mappedContratos,
    ...mappedProjetos,
    ...customEvents
  ].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  const addEvent = (evento: Omit<EventoFinanceiro, 'id'>) => {
    const newEvt: EventoFinanceiro = {
      ...evento,
      id: `evt-custom-${Date.now()}`
    };
    addCustomItem(newEvt);
  };

  return {
    eventos: allEvents,
    addEvent
  };
}
