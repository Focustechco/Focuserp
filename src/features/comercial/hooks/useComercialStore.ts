import { useState, useMemo } from "react";
import { useLocalStorageState } from "@/hooks/useDataStore";
import { 
  MembroEquipeComercial, MetaComercial, OkrComercial, RegraComissao, RegistroComissao,
  ProdutoComercial, ServicoComercial, TabelaPreco, PropostaComercial, 
  ScriptVenda, EstrategiaComercial, PlaybookComercial, AtividadeComercial, 
  AgendaComercialItem, StatusProposta 
} from "../types";
import { 
  INITIAL_EQUIPE, INITIAL_METAS, INITIAL_OKRS, INITIAL_REGRAS_COMISSAO, 
  INITIAL_REGISTROS_COMISSAO, INITIAL_PRODUTOS, INITIAL_SERVICOS, 
  INITIAL_TABELAS, INITIAL_PROPOSTAS, INITIAL_SCRIPTS, INITIAL_ESTRATEGIAS, 
  INITIAL_PLAYBOOKS, INITIAL_ATIVIDADES_COMERCIAIS, INITIAL_AGENDA_COMERCIAL 
} from "../data/initialData";
import { OportunidadeCrm } from "@/features/crm/types";
import { Cliente } from "@/features/clientes/types";
import { Contrato } from "@/features/contratos/types";
import { toast } from "sonner";

export function useComercialStore() {
  const { data: equipe, addItem: addEquipeItem, updateItem: updateEquipeItem, deleteItem: deleteEquipeItem, save: saveEquipe } = 
    useLocalStorageState<MembroEquipeComercial>('focus_comercial_equipe', INITIAL_EQUIPE);

  const { data: metas, addItem: addMetaItem, updateItem: updateMetaItem, deleteItem: deleteMetaItem, save: saveMetas } = 
    useLocalStorageState<MetaComercial>('focus_comercial_metas', INITIAL_METAS);

  const { data: okrs, addItem: addOkrItem, updateItem: updateOkrItem, deleteItem: deleteOkrItem, save: saveOkrs } = 
    useLocalStorageState<OkrComercial>('focus_comercial_okrs', INITIAL_OKRS);

  const { data: regrasComissao, addItem: addRegraComissaoItem, updateItem: updateRegraComissaoItem, deleteItem: deleteRegraComissaoItem, save: saveRegrasComissao } = 
    useLocalStorageState<RegraComissao>('focus_comercial_regras_comissao', INITIAL_REGRAS_COMISSAO);

  const { data: registrosComissao, addItem: addRegistroComissaoItem, updateItem: updateRegistroComissaoItem, deleteItem: deleteRegistroComissaoItem, save: saveRegistrosComissao } = 
    useLocalStorageState<RegistroComissao>('focus_comercial_registros_comissao', INITIAL_REGISTROS_COMISSAO);

  const { data: produtos, addItem: addProdutoItem, updateItem: updateProdutoItem, deleteItem: deleteProdutoItem, save: saveProdutos } = 
    useLocalStorageState<ProdutoComercial>('focus_comercial_produtos', INITIAL_PRODUTOS);

  const { data: servicos, addItem: addServicoItem, updateItem: updateServicoItem, deleteItem: deleteServicoItem, save: saveServicos } = 
    useLocalStorageState<ServicoComercial>('focus_comercial_servicos', INITIAL_SERVICOS);

  const { data: tabelas, addItem: addTabelaItem, updateItem: updateTabelaItem, deleteItem: deleteTabelaItem, save: saveTabelas } = 
    useLocalStorageState<TabelaPreco>('focus_comercial_tabelas', INITIAL_TABELAS);

  const { data: propostas, addItem: addPropostaItem, updateItem: updatePropostaItem, deleteItem: deletePropostaItem, save: savePropostas } = 
    useLocalStorageState<PropostaComercial>('focus_comercial_propostas', INITIAL_PROPOSTAS);

  const { data: scripts, addItem: addScriptItem, updateItem: updateScriptItem, deleteItem: deleteScriptItem, save: saveScripts } = 
    useLocalStorageState<ScriptVenda>('focus_comercial_scripts', INITIAL_SCRIPTS);

  const { data: estrategias, addItem: addEstrategiaItem, updateItem: updateEstrategiaItem, deleteItem: deleteEstrategiaItem, save: saveEstrategias } = 
    useLocalStorageState<EstrategiaComercial>('focus_comercial_estrategias', INITIAL_ESTRATEGIAS);

  const { data: playbooks, addItem: addPlaybookItem, updateItem: updatePlaybookItem, deleteItem: deletePlaybookItem, save: savePlaybooks } = 
    useLocalStorageState<PlaybookComercial>('focus_comercial_playbooks', INITIAL_PLAYBOOKS);

  const { data: atividades, addItem: addAtividadeItem, deleteItem: deleteAtividadeItem, save: saveAtividades } = 
    useLocalStorageState<AtividadeComercial>('focus_comercial_atividades', INITIAL_ATIVIDADES_COMERCIAIS);

  const { data: agenda, addItem: addAgendaItem, updateItem: updateAgendaItem, deleteItem: deleteAgendaItem, save: saveAgenda } = 
    useLocalStorageState<AgendaComercialItem>('focus_comercial_agenda', INITIAL_AGENDA_COMERCIAL);

  // Integração com Oportunidades do CRM Real
  const { data: oportunidades = [] } = useLocalStorageState<OportunidadeCrm>('focus_crm_oportunidades', []);
  const { data: clientes = [] } = useLocalStorageState<Cliente>('focus_clientes', []);
  const { data: contratos = [] } = useLocalStorageState<Contrato>('focus_contratos', []);

  // 1. Ações de Propostas
  const addProposta = (p: Omit<PropostaComercial, 'id' | 'numero' | 'dataCriacao'>) => {
    const newP: PropostaComercial = {
      ...p,
      id: `prop-${Date.now()}`,
      numero: `PROP-2026-${Math.floor(100 + Math.random() * 900)}`,
      dataCriacao: new Date().toISOString().split('T')[0]
    };
    addPropostaItem(newP);
    toast.success(`Proposta ${newP.numero} criada com sucesso para ${newP.clienteNome}!`);
  };

  const updatePropostaStatus = (id: string, status: StatusProposta) => {
    const updateData: Partial<PropostaComercial> = { status };
    if (status === 'Enviada') updateData.dataEnvio = new Date().toISOString().split('T')[0];
    if (status === 'Aprovada') updateData.dataAprovacao = new Date().toISOString().split('T')[0];
    
    updatePropostaItem(id, updateData);
    toast.success(`Status da proposta alterado para "${status}".`);
  };

  // 2. Ações de Atividades Comerciais
  const registrarAtividade = (nova: Omit<AtividadeComercial, 'id'>) => {
    const atv: AtividadeComercial = {
      ...nova,
      id: `atv-${Date.now()}`
    };
    addAtividadeItem(atv);

    // Se possui próximo follow-up, criar na agenda comercial
    if (nova.dataProximoFollowUp) {
      addAgendaItem({
        id: `ag-${Date.now()}`,
        tipo: 'Follow-up Atrasado',
        titulo: `Follow-up: ${nova.empresa} (${nova.proximaAcao || 'Retorno comercial'})`,
        cliente: nova.empresa,
        contato: nova.contato,
        data: nova.dataProximoFollowUp,
        responsavel: nova.responsavel,
        status: 'Pendente',
        prioridade: 'Alta',
        oportunidadeId: nova.oportunidadeId
      });
    }

    toast.success(`Atividade de ${nova.tipo} registrada para ${nova.empresa}!`);
  };

  // 3. Ações da Agenda Comercial
  const toggleAgendaItem = (id: string) => {
    const item = agenda.find(a => a.id === id);
    if (!item) return;
    const newStatus = item.status === 'Pendente' ? 'Concluído' : 'Pendente';
    updateAgendaItem(id, { status: newStatus });
    toast.success(`Item marcado como ${newStatus.toLowerCase()}!`);
  };

  // 4. Ações de Scripts
  const toggleScriptFavorito = (id: string) => {
    const sc = scripts.find(s => s.id === id);
    if (sc) {
      updateScriptItem(id, { favorito: !sc.favorito });
      toast.success(sc.favorito ? 'Removido dos favoritos.' : 'Adicionado aos favoritos!');
    }
  };

  // 5. Ações de Estratégias
  const toggleChecklistEstrategia = (estrategiaId: string, checklistIndex: number) => {
    const est = estrategias.find(e => e.id === estrategiaId);
    if (!est) return;
    const updatedChecklist = [...est.checklist];
    updatedChecklist[checklistIndex].concluido = !updatedChecklist[checklistIndex].concluido;
    updateEstrategiaItem(estrategiaId, { checklist: updatedChecklist });
  };

  // 6. Indicadores Executivos Calculados em Tempo Real
  const kpisExecutivos = useMemo(() => {
    let receitaFechada = 0;
    let receitaPrevista = 0;
    let receitaNegociacao = 0;
    let vendasFechadas = 0;
    let totalOportunidades = oportunidades.length;

    oportunidades.forEach(op => {
      const st = (op.etapa || '').toLowerCase();
      const val = op.valorR$ || 0;

      if (st.includes('ganh') || st.includes('won') || st.includes('fechad') || st.includes('complet')) {
        receitaFechada += val;
        vendasFechadas += 1;
      } else if (st.includes('negocia') || st.includes('fechamento')) {
        receitaNegociacao += val;
      }
      if (!st.includes('perdid') && !st.includes('lost') && !st.includes('cancel')) {
        receitaPrevista += val;
      }
    });

    const metaTotalMes = metas
      .filter(m => m.categoriaTarget === 'Receita Total' && m.status === 'Em Andamento')
      .reduce((acc, m) => acc + m.valorMeta, 0) || 500000;

    const percentualMeta = metaTotalMes > 0 ? ((receitaFechada / metaTotalMes) * 100).toFixed(1) : '0.0';
    const valorRestanteMeta = Math.max(0, metaTotalMes - receitaFechada);

    const ticketMedio = vendasFechadas > 0 ? (receitaFechada / vendasFechadas) : 0;
    const taxaConversaoGeral = totalOportunidades > 0 ? ((vendasFechadas / totalOportunidades) * 100).toFixed(1) : '0.0';

    return {
      receitaFechada,
      receitaPrevista,
      receitaNegociacao,
      metaTotalMes,
      percentualMeta,
      valorRestanteMeta,
      vendasFechadas,
      totalOportunidades,
      ticketMedio,
      taxaConversaoGeral,
      totalAtividades: atividades.length,
      totalPropostas: propostas.length,
      propostasAprovadas: propostas.filter(p => p.status === 'Aprovada').length
    };
  }, [oportunidades, metas, atividades, propostas]);

  return {
    equipe,
    metas,
    okrs,
    regrasComissao,
    registrosComissao,
    produtos,
    servicos,
    tabelas,
    propostas,
    scripts,
    estrategias,
    playbooks,
    atividades,
    agenda,
    oportunidades,
    clientes,
    contratos,
    kpisExecutivos,
    // Ações
    addProposta,
    updatePropostaStatus,
    registrarAtividade,
    toggleAgendaItem,
    toggleScriptFavorito,
    toggleChecklistEstrategia,
    addEquipeItem,
    updateEquipeItem,
    deleteEquipeItem,
    addMetaItem,
    updateMetaItem,
    deleteMetaItem,
    addOkrItem,
    updateOkrItem,
    deleteOkrItem,
    addRegraComissaoItem,
    updateRegraComissaoItem,
    deleteRegraComissaoItem,
    addRegistroComissaoItem,
    updateRegistroComissaoItem,
    deleteRegistroComissaoItem,
    addProdutoItem,
    updateProdutoItem,
    deleteProdutoItem,
    addServicoItem,
    updateServicoItem,
    deleteServicoItem,
    addTabelaItem,
    updateTabelaItem,
    deleteTabelaItem,
    addScriptItem,
    updateScriptItem,
    deleteScriptItem,
    addEstrategiaItem,
    updateEstrategiaItem,
    deleteEstrategiaItem,
    addPlaybookItem,
    updatePlaybookItem,
    deletePlaybookItem,
    addAgendaItem,
    deleteAgendaItem
  };
}
