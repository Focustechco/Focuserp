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

    const dataVenc = (c.dataVencimento || (c as any).vencimento || (c as any).data_vencimento || getBrasiliaTodayIso()).split('T')[0];

    return {
      id: `rec-${c.id}`,
      titulo: c.descricao ? `${c.cliente || (c as any).cliente_nome || 'Cliente'} - ${c.descricao}` : `Recebimento de ${c.cliente || (c as any).cliente_nome || 'Cliente'}`,
      categoria: 'Recebimento',
      data: dataVenc,
      valor: Number(c.valorOriginal || (c as any).valor_original || (c as any).valor || 0),
      entidadeVinculo: c.cliente || (c as any).cliente_nome || 'Cliente',
      clienteId: c.clienteId || (c as any).cliente_id,
      status: statusMapped,
      prioridade: c.status === 'Atrasado' ? 'Alta' : 'Média',
      moduloOrigem: 'Contas a Receber',
      linkOrigem: '/contas-a-receber',
      observacoes: c.observacoes || `Forma de Pagamento: ${c.formaPagamento || 'N/A'}`
    };
  });

  // 2. Contas a Pagar Emitidas (Totalmente integrado com datas, fornecedores e valores)
  const mappedPagar: EventoFinanceiro[] = contasPagar.map(c => {
    let statusMapped: StatusAgenda = 'Em Aberto';
    if (c.status === 'Pago') statusMapped = 'Pago';
    else if (c.status === 'Vencido') statusMapped = 'Vencido';
    else if (c.status === 'Cancelado') statusMapped = 'Cancelado';

    const dataVenc = (c.dataVencimento || (c as any).vencimento || (c as any).data_vencimento || getBrasiliaTodayIso()).split('T')[0];
    const fornNome = c.fornecedor || (c as any).fornecedor_nome || 'Fornecedor';
    const isImposto = (c.categoria || '').toLowerCase().includes('imposto') || (c.categoria || '').toLowerCase().includes('tributo');

    return {
      id: `pag-${c.id}`,
      titulo: c.descricao ? `${fornNome} - ${c.descricao}` : `Pagamento a ${fornNome}`,
      categoria: isImposto ? 'Imposto' : 'Pagamento',
      data: dataVenc,
      valor: Number(c.valorOriginal || (c as any).valor_original || (c as any).valor || 0),
      entidadeVinculo: fornNome,
      status: statusMapped,
      prioridade: c.status === 'Vencido' ? 'Alta' : 'Média',
      moduloOrigem: 'Contas a Pagar',
      linkOrigem: '/contas-a-pagar',
      observacoes: c.observacoes || `Categoria: ${c.categoria || 'Despesa'} • Forma: ${c.formaPagamento || 'Boleto'}`
    };
  });

  // 3. Projeção de Recorrências no Calendário (Recebimentos de Clientes & Pagamentos de Fornecedores)
  const mappedRecorrencias: EventoFinanceiro[] = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const yearsToProject = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  const todayIso = getBrasiliaTodayIso();

  recorrencias.forEach(r => {
    if (!r || r.status === 'Encerrada') return;

    const isDespesa = r.tipo === 'Despesa' || r.origem === 'despesa' || r.origem === 'fornecedor' || Boolean(r.fornecedorNome);
    const entidadeNome = isDespesa 
      ? (r.fornecedorNome || r.clienteNome || 'Fornecedor')
      : (r.clienteNome || (r as any).clientName || 'Cliente');

    const dataInicioStr = r.dataInicio || `${currentYear}-01-01`;
    const dataInicio = parseDateSafe(dataInicioStr);
    const startYear = isNaN(dataInicio.getFullYear()) ? currentYear : dataInicio.getFullYear();
    const startMonth = isNaN(dataInicio.getMonth()) ? 0 : dataInicio.getMonth();
    const diaVenc = r.diaVencimento || 10;

    yearsToProject.forEach(year => {
      for (let month = 0; month < 12; month++) {
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

        if (dateStr < dataInicioStr.split('T')[0]) continue;
        if (r.dataFim && dateStr > r.dataFim.split('T')[0]) continue;
        if (r.dataFinal && dateStr > r.dataFinal.split('T')[0]) continue;

        if (isDespesa) {
          // Despesa Recorrente
          const tituloExistentePagar = contasPagar.find(c => 
            (c.fornecedor && c.fornecedor.toLowerCase() === entidadeNome.toLowerCase()) &&
            (c.dataVencimento === dateStr || (c.descricao && c.descricao.includes(r.descricao)))
          );

          let statusEvent: StatusAgenda = 'Em Aberto';
          if (tituloExistentePagar) {
            if (tituloExistentePagar.status === 'Pago') statusEvent = 'Pago';
            else if (tituloExistentePagar.status === 'Vencido') statusEvent = 'Vencido';
            else if (tituloExistentePagar.status === 'Cancelado') statusEvent = 'Cancelado';
          } else {
            statusEvent = dateStr < todayIso ? 'Vencido' : 'Previsto';
          }

          const dupIndex = mappedPagar.findIndex(m => 
            m.entidadeVinculo?.toLowerCase() === entidadeNome.toLowerCase() && m.data === dateStr
          );

          if (dupIndex !== -1) {
            mappedPagar[dupIndex].titulo = `[Recorrência Despesa] ${entidadeNome} - ${r.descricao || 'Despesa Fixa'}`;
            mappedPagar[dupIndex].observacoes = `Recorrência ${r.frequencia || 'Mensal'} (Dia ${diaVenc} do mês)`;
          } else {
            mappedRecorrencias.push({
              id: `rec-pag-proj-${r.id}-${year}-${month + 1}`,
              titulo: `[Recorrência Despesa] ${entidadeNome} - ${r.descricao || 'Despesa Fixa'}`,
              categoria: 'Pagamento',
              data: dateStr,
              valor: Number(r.valor || 0),
              entidadeVinculo: entidadeNome,
              status: statusEvent,
              prioridade: 'Alta',
              moduloOrigem: 'Contas a Pagar',
              linkOrigem: '/contas-a-pagar',
              observacoes: `Recorrência ${r.frequencia || 'Mensal'} (Dia ${diaVenc} do mês) • Fornecedor: ${entidadeNome}`
            });
          }
        } else {
          // Receita Recorrente
          const tituloExistente = contasReceber.find(c => 
            (c.clienteId === r.clientId || (c.cliente && c.cliente.toLowerCase() === entidadeNome.toLowerCase())) &&
            (c.dataVencimento === dateStr || (c.descricao && c.descricao.includes(r.descricao)))
          );

          let statusEvent: StatusAgenda = 'Em Aberto';
          if (tituloExistente) {
            if (tituloExistente.status === 'Recebido') statusEvent = 'Recebido';
            else if (tituloExistente.status === 'Atrasado') statusEvent = 'Vencido';
            else if (tituloExistente.status === 'Cancelado') statusEvent = 'Cancelado';
          } else {
            statusEvent = dateStr < todayIso ? 'Vencido' : 'Previsto';
          }

          const duplicateIndex = mappedReceber.findIndex(m => 
            (m.clienteId === r.clientId || m.entidadeVinculo?.toLowerCase() === entidadeNome.toLowerCase()) &&
            m.data === dateStr
          );

          if (duplicateIndex !== -1) {
            mappedReceber[duplicateIndex].categoria = 'Recorrência';
            mappedReceber[duplicateIndex].titulo = `[Recorrência Receita] ${entidadeNome} - ${r.descricao || 'Mensalidade'}`;
            mappedReceber[duplicateIndex].observacoes = `Recorrência ${r.frequencia || 'Mensal'} (Todo dia ${diaVenc} do mês)`;
          } else {
            mappedRecorrencias.push({
              id: `rec-proj-${r.id}-${year}-${month + 1}`,
              titulo: `[Recorrência Receita] ${entidadeNome} - ${r.descricao || 'Mensalidade'}`,
              categoria: 'Recorrência',
              data: dateStr,
              valor: Number(r.valor || 0),
              entidadeVinculo: entidadeNome,
              clienteId: r.clientId,
              status: statusEvent,
              prioridade: 'Alta',
              moduloOrigem: 'Contas a Receber',
              linkOrigem: '/contas-a-receber',
              observacoes: `Recorrência ${r.frequencia || 'Mensal'} (Dia ${diaVenc} do mês) • Próxima Cobrança: ${r.proximaCobranca || dateStr}`
            });
          }
        }
      }
    });
  });

  // 4. Contratos
  const mappedContratos: EventoFinanceiro[] = contratos.map(ct => {
    const dataVenc = (ct.dataVencimento || ct.dataInicio || getBrasiliaTodayIso()).split('T')[0];
    return {
      id: `ct-${ct.id}`,
      titulo: ct.numeroContrato ? `Vencimento do Contrato ${ct.numeroContrato}` : `Contrato ${ct.clienteNome || ''}`,
      categoria: 'Contrato',
      data: dataVenc,
      valor: Number(ct.valorTotal || 0),
      entidadeVinculo: ct.clienteNome || 'Cliente',
      status: (ct.status === 'Ativo' ? 'Em Aberto' : 'Concluído') as StatusAgenda,
      prioridade: 'Média',
      moduloOrigem: 'Contratos',
      linkOrigem: '/contratos'
    };
  });

  // 5. Projetos
  const mappedProjetos: EventoFinanceiro[] = projetos.map(p => {
    const dataEntrega = (p.dataFinal || (p as any).dataPrevisaoFim || (p as any).data_previsao_fim || getBrasiliaTodayIso()).split('T')[0];
    return {
      id: `prj-${p.id}`,
      titulo: `Entrega do Projeto: ${p.nome}`,
      categoria: 'Projeto',
      data: dataEntrega,
      valor: Number(p.valorContratado || (p as any).valor_contratado || 0),
      entidadeVinculo: p.nome,
      status: (p.status === 'Concluído' ? 'Concluído' : 'Em Aberto') as StatusAgenda,
      prioridade: 'Média',
      moduloOrigem: 'Projetos',
      linkOrigem: '/projetos'
    };
  });

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
