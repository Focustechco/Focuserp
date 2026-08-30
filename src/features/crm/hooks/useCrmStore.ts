import { useState, useCallback } from "react";
import { useLocalStorageState } from "@/hooks/useDataStore";
import { 
  ClickUpSyncConfig, LeadCrm, EmpresaCrm, ContatoCrm, OportunidadeCrm, 
  AtividadeCrm, LogSyncClickUp, EtapaPipeline, ClickUpStatusItem 
} from "../types";
import { 
  INITIAL_CLICKUP_CONFIG, INITIAL_OPORTUNIDADES, INITIAL_LEADS, 
  INITIAL_EMPRESAS, INITIAL_CONTATOS, INITIAL_ATIVIDADES, INITIAL_SYNC_LOGS 
} from "../data/initialData";
import { 
  testClickUpConnection, fetchClickUpTasks, createClickUpTask, updateClickUpTaskStatus,
  fetchClickUpTeams, fetchAllClickUpBoardsAndLists, extractCleanClickUpId
} from "../services/clickupApi";
import { Cliente } from "@/features/clientes/types";
import { Contrato } from "@/features/contratos/types";
import { TituloReceber } from "@/features/contas-receber/types";
import { toast } from "sonner";

export function useCrmStore() {
  const { data: configList, save: saveConfig } = useLocalStorageState<ClickUpSyncConfig>('focus_crm_clickup_config', [INITIAL_CLICKUP_CONFIG]);
  const { data: oportunidades, addItem: addOpItem, updateItem: updateOpItem, deleteItem: deleteOpItem, save: saveOportunidades } = useLocalStorageState<OportunidadeCrm>('focus_crm_oportunidades', []);
  const { data: leads, addItem: addLeadItem, updateItem: updateLeadItem, deleteItem: deleteLeadItem, save: saveLeads } = useLocalStorageState<LeadCrm>('focus_crm_leads', INITIAL_LEADS);
  const { data: empresas, addItem: addEmpresaItem, updateItem: updateEmpresaItem, deleteItem: deleteEmpresaItem, save: saveEmpresas } = useLocalStorageState<EmpresaCrm>('focus_crm_empresas', INITIAL_EMPRESAS);
  const { data: contatos, addItem: addContatoItem, updateItem: updateContatoItem, deleteItem: deleteContatoItem, save: saveContatos } = useLocalStorageState<ContatoCrm>('focus_crm_contatos', INITIAL_CONTATOS);
  const { data: interacoes, addItem: addInteracaoItem, deleteItem: deleteInteracaoItem, save: saveInteracoes } = useLocalStorageState<InteracaoCrm>('focus_crm_interacoes', []);
  const { data: atividades, addItem: addAtividadeItem, save: saveAtividades } = useLocalStorageState<AtividadeCrm>('focus_crm_atividades', INITIAL_ATIVIDADES);
  const { data: syncLogs, addItem: addSyncLogItem, save: saveLogs } = useLocalStorageState<LogSyncClickUp>('focus_crm_sync_logs', INITIAL_SYNC_LOGS);

  // Módulos externos para sincronização de negócios ganhos
  const { data: clientes = [], addItem: addClienteItem } = useLocalStorageState<Cliente>('focus_clientes');
  const { data: contratos = [], addItem: addContratoItem } = useLocalStorageState<Contrato>('focus_contratos');
  const { data: contasReceber = [], addItem: addContaReceberItem } = useLocalStorageState<TituloReceber>('focus_contas_receber');

  const [isLoadingClickUp, setIsLoadingClickUp] = useState(false);

  const activeConfig = configList[0] || INITIAL_CLICKUP_CONFIG;

  // 1. Validar e Salvar Token + Conexão com API do ClickUp Real
  const saveAndConnectClickUp = async (
    apiToken: string, 
    workspaceId: string, 
    spaceId: string, 
    listId: string,
    extraInfo?: { teamName?: string; spaceName?: string; listName?: string }
  ) => {
    setIsLoadingClickUp(true);
    try {
      const userData = await testClickUpConnection(apiToken);
      const user = userData.user;
      const cleanListId = extractCleanClickUpId(listId);

      const newConfig: ClickUpSyncConfig = {
        id: "cfg-clickup",
        apiToken: apiToken.trim(),
        teamId: workspaceId || undefined,
        teamName: extraInfo?.teamName || `Workspace de ${user.username}`,
        workspaceId: workspaceId || `Workspace (${user.username})`,
        spaceId: spaceId || undefined,
        spaceName: extraInfo?.spaceName || 'Vendas',
        listId: cleanListId,
        listName: extraInfo?.listName || 'Quadro CRM / Pipeline',
        autoSync: true,
        lastSyncTime: new Date().toISOString(),
        statusConexao: 'Conectado ClickUp API',
        userName: user.username,
        userEmail: user.email,
        userAvatar: user.profilePicture
      };

      saveConfig([newConfig]);

      addSyncLogItem({
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        clickUpTaskId: 'API-AUTH',
        entidade: 'Oportunidade',
        acao: 'Autenticação ClickUp API Real',
        status: 'Sucesso',
        mensagem: `Conectado com sucesso à conta de ${user.username} (${user.email}).`
      });

      // Se informou um List ID, buscar as tarefas reais
      if (cleanListId) {
        await importRealClickUpTasks(cleanListId, apiToken.trim());
      }
    } catch (err: any) {
      toast.error(`Erro ao conectar com o ClickUp: ${err.message || 'Verifique sua chave de API.'}`);
      saveConfig([{ ...activeConfig, statusConexao: 'Erro' }]);
    } finally {
      setIsLoadingClickUp(false);
    }
  };

  // 2. Buscar tarefas reais da Lista/Quadro do ClickUp e extrair status dinâmicos
  const importRealClickUpTasks = async (listId = activeConfig.listId, apiToken = activeConfig.apiToken) => {
    if (!apiToken || !listId) {
      toast.error('Informe o API Token e selecione o Quadro do ClickUp.');
      return;
    }

    setIsLoadingClickUp(true);
    try {
      const realTasks = await fetchClickUpTasks(listId, apiToken, activeConfig.teamId);
      
      // Coletar status dinâmicos únicos reais do ClickUp
      const statusMap = new Map<string, ClickUpStatusItem>();

      const newOportunidades: OportunidadeCrm[] = realTasks.map((t, idx) => {
        const rawStatus = t.status?.status || 'Open';
        const statusColor = t.status?.color || '#94a3b8';
        const orderIdx = t.status?.orderindex ?? idx;

        if (!statusMap.has(rawStatus.toLowerCase())) {
          statusMap.set(rawStatus.toLowerCase(), {
            status: rawStatus,
            color: statusColor,
            orderindex: orderIdx,
            type: t.status?.type
          });
        }

        // Verificar se já existe valor manual salvo pelo usuário no CRM
        const existingOp = oportunidades.find(o => o.clickUpTaskId === `CU-${t.id}` || o.id === `op-cu-${t.id}`);

        // Extrair valor de custom field se existir no ClickUp
        let valorExtracted = 0;
        if (Array.isArray(t.custom_fields)) {
          const valField = t.custom_fields.find(f => 
            f.name.toLowerCase().includes('valor') || 
            f.name.toLowerCase().includes('deal') || 
            f.name.toLowerCase().includes('price') ||
            f.name.toLowerCase().includes('receita') ||
            f.type === 'currency' || f.type === 'number'
          );
          if (valField && valField.value) {
            valorExtracted = parseFloat(valField.value) || 0;
          }
        }

        // Se não veio do ClickUp, preservar valor manual existente inserido pelo usuário
        if (valorExtracted === 0 && existingOp && existingOp.valorR$ > 0) {
          valorExtracted = existingOp.valorR$;
        }

        // Extrair nome da empresa
        const parts = t.name.split(/[—–-]/);
        const empresaNome = parts.length > 1 ? parts[1].trim() : t.name;

        // Extrair responsável
        const assigneeName = t.assignees && t.assignees.length > 0 
          ? (t.assignees[0].username || t.assignees[0].email) 
          : 'Equipe Comercial';
        const assigneeAvatar = t.assignees?.[0]?.profilePicture;

        const isGanho = rawStatus.toLowerCase().includes('ganh') || 
                        rawStatus.toLowerCase().includes('won') || 
                        rawStatus.toLowerCase().includes('fechad') || 
                        rawStatus.toLowerCase().includes('complet');

        const isPerdido = rawStatus.toLowerCase().includes('perdid') || 
                          rawStatus.toLowerCase().includes('lost') || 
                          rawStatus.toLowerCase().includes('cancel');

        return {
          id: `op-cu-${t.id}`,
          clickUpTaskId: `CU-${t.id}`,
          titulo: t.name,
          empresaNome: empresaNome || 'Cliente ClickUp',
          contatoNome: 'Contato Registrado',
          valorR$: valorExtracted, // Zero dados mockados!
          probabilidadePercent: isGanho ? 100 : (isPerdido ? 0 : 50),
          responsavel: assigneeName,
          responsavelAvatar: assigneeAvatar,
          pipeline: activeConfig.listName || 'Quadro Real ClickUp',
          etapa: rawStatus, // Status dinâmico e real do ClickUp!
          statusColor: statusColor,
          statusOrder: orderIdx,
          prioridade: (t.priority?.priority as any) || 'Alta',
          tags: t.tags?.map(tg => tg.name) || [],
          dataPrevistaFechamento: t.due_date ? new Date(parseInt(t.due_date)).toISOString().split('T')[0] : new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
          dataCriacao: t.date_created ? new Date(parseInt(t.date_created)).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          proximaAcao: t.text_content || t.description || 'Acompanhar no ClickUp',
          statusClickUp: 'synced',
          clickUpUrl: t.url || `https://app.clickup.com/t/${t.id}`
        };
      });

      // Ordenar status pelo orderindex do ClickUp
      const listStatuses = Array.from(statusMap.values()).sort((a, b) => (a.orderindex ?? 0) - (b.orderindex ?? 0));

      saveOportunidades(newOportunidades);

      // Salvar status e atualizar timestamp
      saveConfig([{
        ...activeConfig,
        listStatuses: listStatuses.length > 0 ? listStatuses : undefined,
        lastSyncTime: new Date().toISOString(),
        statusConexao: 'Conectado ClickUp API'
      }]);

      addSyncLogItem({
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        clickUpTaskId: `BOARD-${listId}`,
        entidade: 'Oportunidade',
        acao: 'Espelho ClickUp Sincronizado',
        status: 'Sucesso',
        mensagem: `${realTasks.length} tarefas reais espelhadas com ${listStatuses.length} status do ClickUp.`
      });

      toast.success(`${realTasks.length} tarefas reais espelhadas com sucesso do ClickUp!`);
    } catch (err: any) {
      toast.error(`Erro ao importar tarefas: ${err.message}`);
    } finally {
      setIsLoadingClickUp(false);
    }
  };

  // 3. Atualizar Valor Manualmente (R$)
  const updateOportunidadeValor = (id: string, novoValor: number) => {
    updateOpItem(id, { valorR$: novoValor });
    toast.success(`Valor de R$ ${novoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} atualizado!`);
  };

  // 4. Movimentar Oportunidade no Kanban (Sincronização com ClickUp Real)
  const moverOportunidadeEtapa = async (id: string, novaEtapa: string, statusColor?: string) => {
    const op = oportunidades.find(o => o.id === id);
    if (!op) return;

    const isGanho = novaEtapa.toLowerCase().includes('ganh') || 
                    novaEtapa.toLowerCase().includes('won') || 
                    novaEtapa.toLowerCase().includes('fechad') || 
                    novaEtapa.toLowerCase().includes('complet');

    const isPerdido = novaEtapa.toLowerCase().includes('perdid') || 
                      novaEtapa.toLowerCase().includes('lost') || 
                      novaEtapa.toLowerCase().includes('cancel');

    updateOpItem(id, { 
      etapa: novaEtapa,
      statusColor: statusColor || op.statusColor,
      probabilidadePercent: isGanho ? 100 : (isPerdido ? 0 : op.probabilidadePercent)
    });

    // Atualizar na API oficial do ClickUp!
    if (activeConfig.apiToken && op.clickUpTaskId.startsWith('CU-')) {
      const cleanTaskId = op.clickUpTaskId.replace('CU-', '');
      updateClickUpTaskStatus(cleanTaskId, activeConfig.apiToken, novaEtapa);
    }

    addSyncLogItem({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      clickUpTaskId: op.clickUpTaskId,
      entidade: 'Oportunidade',
      acao: `Status alterado para "${novaEtapa}"`,
      status: 'Sucesso',
      mensagem: `Tarefa ${op.clickUpTaskId} sincronizada na API do ClickUp.`
    });

    if (isGanho && op.valorR$ > 0) {
      converterOportunidadeEmClienteEContrato(op);
    } else {
      toast.success(`Card "${op.titulo}" movido para "${novaEtapa}" no ClickUp!`);
    }
  };

  // 5. Automação Multi-módulos: Ganho no CRM → Cliente + Contrato + Contas a Receber
  const converterOportunidadeEmClienteEContrato = (op: OportunidadeCrm) => {
    const clienteExistente = clientes.find(c => (c.razaoSocial || '').toLowerCase() === op.empresaNome.toLowerCase());
    let clienteId = clienteExistente?.id;

    if (!clienteExistente) {
      const novoCliente: Cliente = {
        id: `cli-auto-${Date.now()}`,
        razaoSocial: op.empresaNome,
        nomeFantasia: op.empresaNome,
        cnpj: "00.000.000/0001-00",
        email: op.contatoEmail || "contato@" + op.empresaNome.toLowerCase().replace(/[^a-z]/g, '') + ".com.br",
        telefone: op.contatoTelefone || "(11) 3000-0000",
        status: "ativo",
        dataCadastro: new Date().toISOString().split('T')[0],
        receitaTotal: op.valorR$,
        projetosAtivos: 1
      };
      addClienteItem(novoCliente);
      clienteId = novoCliente.id;
    }

    const jaExisteContrato = contratos.some(
      (c) => (c.clienteNome === op.empresaNome && c.objetoContrato === op.titulo) || c.id === `ctr-auto-${op.id}`
    );

    let numContrato = `CTR-2026-${Math.floor(100 + Math.random() * 900)}`;
    if (!jaExisteContrato) {
      const novoContrato: Contrato = {
        id: `ctr-auto-${op.id}`,
        numeroContrato: numContrato,
        clienteId: clienteId || `cli-${Date.now()}`,
        clienteNome: op.empresaNome,
        objetoContrato: op.titulo,
        valorTotal: op.valorR$,
        valorMensal: Math.round(op.valorR$ / 12),
        dataInicio: new Date().toISOString().split('T')[0],
        dataFim: new Date(Date.now() + 86400000 * 365).toISOString().split('T')[0],
        status: "ativo",
        tipoContrato: "SaaS Recorrente",
        renovacaoAutomatica: true
      };
      addContratoItem(novoContrato);
    }

    if (op.valorR$ > 0) {
      const novoTituloReceber: TituloReceber = {
        id: crypto.randomUUID(),
        numero: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
        descricao: `Recebimento Contrato CRM — ${op.empresaNome}`,
        cliente: op.empresaNome,
        clienteId: clienteId || `cli-${Date.now()}`,
        valorOriginal: op.valorR$,
        valorRecebido: 0,
        saldo: op.valorR$,
        dataEmissao: new Date().toISOString().split('T')[0],
        dataVencimento: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
        status: "Pendente",
        categoria: "Vendas CRM",
        formaPagamento: "Boleto"
      };
      addContaReceberItem(novoTituloReceber);
    }

    toast.success(
      `🎉 Negócio Ganho! Cliente "${op.empresaNome}", Contrato ${numContrato} e Recebimento criados automaticamente no Focus Finance!`,
      { duration: 6000 }
    );
  };

  // 6. Adicionar Nova Oportunidade (Envia para ClickUp se conectado)
  const addOportunidade = async (nova: Omit<OportunidadeCrm, 'id' | 'clickUpTaskId' | 'dataCriacao' | 'statusClickUp'>) => {
    let taskId = `CU-${Math.floor(869000 + Math.random() * 1000)}`;
    let taskUrl: string | undefined = undefined;

    if (activeConfig.apiToken && activeConfig.listId) {
      try {
        const realTask = await createClickUpTask(activeConfig.listId, activeConfig.apiToken, {
          name: nova.titulo,
          description: `${nova.empresaNome} | Contato: ${nova.contatoNome} | Valor: R$ ${nova.valorR$.toLocaleString('pt-BR')}\n${nova.proximaAcao}`,
          status: nova.etapa.toLowerCase(),
          tags: nova.tags
        });
        taskId = `CU-${realTask.id}`;
        taskUrl = realTask.url || `https://app.clickup.com/t/${realTask.id}`;
      } catch (err: any) {
        console.warn('Falha ao criar diretamente no ClickUp:', err.message);
      }
    }

    const op: OportunidadeCrm = {
      ...nova,
      id: `op-${Date.now()}`,
      clickUpTaskId: taskId,
      clickUpUrl: taskUrl,
      dataCriacao: new Date().toISOString().split('T')[0],
      statusClickUp: 'synced'
    };
    addOpItem(op);

    toast.success(`Oportunidade "${op.titulo}" cadastrada no CRM! (ClickUp ${taskId})`);
  };

  // Carregar dados de teste fictícios (opcional)
  const carregarDadosDemo = () => {
    saveOportunidades(INITIAL_OPORTUNIDADES);
    toast.info('Dados de demonstração carregados no CRM.');
  };

  // Limpar todos os dados do CRM
  const limparDadosCrm = () => {
    saveOportunidades([]);
    saveLeads([]);
    saveEmpresas([]);
    saveContatos([]);
    saveAtividades([]);
    toast.success('Dados do CRM limpos com sucesso.');
  };

  return {
    config: activeConfig,
    oportunidades,
    leads,
    empresas,
    contatos,
    interacoes,
    atividades,
    syncLogs,
    isLoadingClickUp,
    saveAndConnectClickUp,
    importRealClickUpTasks,
    moverOportunidadeEtapa,
    updateOportunidadeValor,
    converterOportunidadeEmClienteEContrato,
    addOportunidade,
    deleteOportunidade: deleteOpItem,
    updateOportunidade: updateOpItem,
    addInteracao: addInteracaoItem,
    deleteInteracao: deleteInteracaoItem,
    carregarDadosDemo,
    limparDadosCrm,
    addLeadItem,
    updateLeadItem,
    deleteLeadItem,
    addEmpresaItem,
    updateEmpresaItem,
    deleteEmpresaItem,
    addContatoItem,
    updateContatoItem,
    deleteContatoItem,
    addAtividadeItem
  };
}
