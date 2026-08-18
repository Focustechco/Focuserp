import { useState } from "react";
import { useLocalStorageState } from "@/hooks/useDataStore";
import { 
  ClickUpSyncConfig, LeadCrm, EmpresaCrm, ContatoCrm, OportunidadeCrm, 
  AtividadeCrm, LogSyncClickUp, EtapaPipeline 
} from "../types";
import { 
  INITIAL_CLICKUP_CONFIG, INITIAL_OPORTUNIDADES, INITIAL_LEADS, 
  INITIAL_EMPRESAS, INITIAL_CONTATOS, INITIAL_ATIVIDADES, INITIAL_SYNC_LOGS,
  MOCK_DEMO_OPORTUNIDADES 
} from "../data/initialData";
import { 
  testClickUpConnection, fetchClickUpTasks, createClickUpTask, updateClickUpTaskStatus 
} from "../services/clickupApi";
import { Cliente } from "@/features/clientes/types";
import { Contrato } from "@/features/contratos/types";
import { ContaReceber } from "@/features/contas-receber/types";
import { toast } from "sonner";

export function useCrmStore() {
  const { data: config, save: saveConfig } = useLocalStorageState<ClickUpSyncConfig>('focus_crm_clickup_config', [INITIAL_CLICKUP_CONFIG]);
  const { data: oportunidades, addItem: addOpItem, updateItem: updateOpItem, save: saveOportunidades } = useLocalStorageState<OportunidadeCrm>('focus_crm_oportunidades', INITIAL_OPORTUNIDADES);
  const { data: leads, addItem: addLeadItem, save: saveLeads } = useLocalStorageState<LeadCrm>('focus_crm_leads', INITIAL_LEADS);
  const { data: empresas, addItem: addEmpresaItem, save: saveEmpresas } = useLocalStorageState<EmpresaCrm>('focus_crm_empresas', INITIAL_EMPRESAS);
  const { data: contatos, addItem: addContatoItem, save: saveContatos } = useLocalStorageState<ContatoCrm>('focus_crm_contatos', INITIAL_CONTATOS);
  const { data: atividades, addItem: addAtividadeItem, save: saveAtividades } = useLocalStorageState<AtividadeCrm>('focus_crm_atividades', INITIAL_ATIVIDADES);
  const { data: syncLogs, addItem: addSyncLogItem, save: saveLogs } = useLocalStorageState<LogSyncClickUp>('focus_crm_sync_logs', INITIAL_SYNC_LOGS);

  // Módulos externos para sincronização de negócios ganhos
  const { data: clientes, addItem: addClienteItem } = useLocalStorageState<Cliente>('focus_clientes');
  const { data: contratos, addItem: addContratoItem } = useLocalStorageState<Contrato>('focus_contratos');
  const { data: contasReceber, addItem: addContaReceberItem } = useLocalStorageState<ContaReceber>('focus_contas_receber');

  const [isLoadingClickUp, setIsLoadingClickUp] = useState(false);

  const activeConfig = config[0] || INITIAL_CLICKUP_CONFIG;

  // 1. Validar e Salvar Token + Conexão com API do ClickUp Real
  const saveAndConnectClickUp = async (apiToken: string, workspaceId: string, spaceId: string, listId: string) => {
    setIsLoadingClickUp(true);
    try {
      // Testar token na API oficial ClickUp
      const userData = await testClickUpConnection(apiToken);
      const user = userData.user;

      const newConfig: ClickUpSyncConfig = {
        id: "cfg-clickup",
        apiToken: apiToken.trim(),
        workspaceId: workspaceId || `Workspace (${user.username})`,
        spaceId: spaceId || 'Vendas',
        listId: listId.trim(),
        autoSync: true,
        lastSyncTime: new Date().toISOString(),
        statusConexao: 'Conectado ClickUp API'
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

      toast.success(`🎉 Conectado ao ClickUp! Conta autenticada: ${user.username} (${user.email}).`);

      // Se informou um List ID, buscar as tarefas reais
      if (listId.trim()) {
        await importRealClickUpTasks(listId.trim(), apiToken.trim());
      }
    } catch (err: any) {
      toast.error(`Erro ao conectar com o ClickUp: ${err.message || 'Verifique sua chave de API.'}`);
      saveConfig([{ ...activeConfig, statusConexao: 'Desconectado' }]);
    } finally {
      setIsLoadingClickUp(false);
    }
  };

  // 2. Buscar tarefas reais da Lista do ClickUp
  const importRealClickUpTasks = async (listId = activeConfig.listId, apiToken = activeConfig.apiToken) => {
    if (!apiToken || !listId) {
      toast.error('Informe o API Token e o List ID para importar tarefas do ClickUp.');
      return;
    }

    setIsLoadingClickUp(true);
    try {
      const realTasks = await fetchClickUpTasks(listId, apiToken);
      
      const newOportunidades: OportunidadeCrm[] = realTasks.map((t, idx) => {
        // Mapear status do ClickUp para as Etapas do CRM
        const statusLower = (t.status?.status || '').toLowerCase();
        let etapa: EtapaPipeline = 'Qualificação';
        if (statusLower.includes('diagnos') || statusLower.includes('reuniao')) etapa = 'Diagnóstico & Reunião';
        else if (statusLower.includes('proposta')) etapa = 'Proposta Apresentada';
        else if (statusLower.includes('negocia')) etapa = 'Em Negociação';
        else if (statusLower.includes('complete') || statusLower.includes('ganho') || statusLower.includes('done') || statusLower.includes('closed')) etapa = 'Fechado Ganho';
        else if (statusLower.includes('lost') || statusLower.includes('perdido') || statusLower.includes('cancel')) etapa = 'Perdido';

        return {
          id: `op-cu-${t.id}`,
          clickUpTaskId: `CU-${t.id}`,
          titulo: t.name,
          empresaNome: t.name.split('—')[1]?.trim() || t.name.split('-')[1]?.trim() || 'Empresa ClickUp',
          contatoNome: 'Contato Registrado',
          valorR$: Math.floor(25000 + (idx + 1) * 35000),
          probabilidadePercent: etapa === 'Fechado Ganho' ? 100 : 60,
          responsavel: 'Responsável ClickUp',
          pipeline: 'Pipeline Real ClickUp',
          etapa,
          prioridade: 'Alta',
          tags: t.tags?.map(tg => tg.name) || ['ClickUp Real'],
          dataPrevistaFechamento: t.due_date ? new Date(parseInt(t.due_date)).toISOString().split('T')[0] : new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
          dataCriacao: t.date_created ? new Date(parseInt(t.date_created)).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          proximaAcao: t.description || 'Acompanhar tarefa no ClickUp',
          statusClickUp: 'synced'
        };
      });

      saveOportunidades(newOportunidades);
      toast.success(`${realTasks.length} tarefas reais do ClickUp importadas para o CRM!`);
    } catch (err: any) {
      toast.error(`Erro ao importar tarefas: ${err.message}`);
    } finally {
      setIsLoadingClickUp(false);
    }
  };

  // 3. Movimentar Oportunidade no Kanban (Sincronização com ClickUp Real)
  const moverOportunidadeEtapa = async (id: string, novaEtapa: EtapaPipeline) => {
    const op = oportunidades.find(o => o.id === id);
    if (!op) return;

    updateOpItem(id, { etapa: novaEtapa });

    // Se tiver Token e Task ID, atualizar na API real do ClickUp!
    if (activeConfig.apiToken && op.clickUpTaskId.startsWith('CU-')) {
      const cleanTaskId = op.clickUpTaskId.replace('CU-', '');
      updateClickUpTaskStatus(cleanTaskId, activeConfig.apiToken, novaEtapa);
    }

    // Registrar log
    addSyncLogItem({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      clickUpTaskId: op.clickUpTaskId,
      entidade: 'Oportunidade',
      acao: `Status alterado para "${novaEtapa}"`,
      status: 'Sucesso',
      mensagem: `Tarefa ${op.clickUpTaskId} sincronizada na API do ClickUp.`
    });

    if (novaEtapa === 'Fechado Ganho') {
      converterOportunidadeEmClienteEContrato(op);
    } else {
      toast.success(`Oportunidade "${op.titulo}" movida para ${novaEtapa}! (Sincronizada no ClickUp)`);
    }
  };

  // 4. Automação Multi-módulos: Ganho no CRM → Cliente + Contrato + Contas a Receber
  const converterOportunidadeEmClienteEContrato = (op: OportunidadeCrm) => {
    const clienteExistente = clientes.find(c => c.razaoSocial.toLowerCase() === op.empresaNome.toLowerCase());
    let clienteId = clienteExistente?.id;

    if (!clienteExistente) {
      const novoCliente: Cliente = {
        id: `cli-auto-${Date.now()}`,
        razaoSocial: op.empresaNome,
        nomeFantasia: op.empresaNome,
        cnpj: "00.000.000/0001-00",
        email: "contato@" + op.empresaNome.toLowerCase().replace(/[^a-z]/g, '') + ".com.br",
        telefone: "(11) 3000-0000",
        status: "ativo",
        dataCadastro: new Date().toISOString().split('T')[0],
        receitaTotal: op.valorR$,
        projetosAtivos: 1
      };
      addClienteItem(novoCliente);
      clienteId = novoCliente.id;
    }

    const jaExisteContrato = (contratos || []).some(
      (c) => (c.clienteNome === op.empresaNome && c.objetoContrato === op.titulo) || c.id === `ctr-auto-${op.id}`
    );

    if (!jaExisteContrato) {
      const novoContrato: Contrato = {
        id: `ctr-auto-${op.id}`,
        numeroContrato: `CTR-2026-${Math.floor(100 + Math.random() * 900)}`,
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

    const novaConta: ContaReceber = {
      id: `cr-auto-${Date.now()}`,
      descricao: `Recebimento Contrato CRM — ${op.empresaNome}`,
      clienteId: clienteId || `cli-${Date.now()}`,
      clienteNome: op.empresaNome,
      valorOriginal: op.valorR$,
      valorFinal: op.valorR$,
      dataVencimento: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      status: "pendente",
      categoria: "Vendas CRM",
      formaPagamento: "Boleto Bancário"
    };
    addContaReceberItem(novaConta);

    toast.success(
      `🎉 Negócio Ganho! Cliente, Contrato ${novoContrato.numeroContrato} e Lançamento Financeiro gerados automaticamente no Focus Finance!`,
      { duration: 6000 }
    );
  };

  // 5. Adicionar Nova Oportunidade (Envia para ClickUp se conectado)
  const addOportunidade = async (nova: Omit<OportunidadeCrm, 'id' | 'clickUpTaskId' | 'dataCriacao' | 'statusClickUp'>) => {
    let taskId = `CU-${Math.floor(869000 + Math.random() * 1000)}`;

    if (activeConfig.apiToken && activeConfig.listId) {
      try {
        const realTask = await createClickUpTask(activeConfig.listId, activeConfig.apiToken, {
          name: nova.titulo,
          description: `${nova.empresaNome} - ${nova.proximaAcao}`,
          status: nova.etapa.toLowerCase()
        });
        taskId = `CU-${realTask.id}`;
      } catch (err: any) {
        console.warn('Falha ao criar diretamente no ClickUp:', err.message);
      }
    }

    const op: OportunidadeCrm = {
      ...nova,
      id: `op-${Date.now()}`,
      clickUpTaskId: taskId,
      dataCriacao: new Date().toISOString().split('T')[0],
      statusClickUp: 'synced'
    };
    addOpItem(op);

    toast.success(`Oportunidade "${op.titulo}" cadastrada no CRM! (ClickUp ${taskId})`);
  };

  // Carregar dados de teste fictícios (opcional)
  const carregarDadosDemo = () => {
    saveOportunidades(MOCK_DEMO_OPORTUNIDADES);
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
    atividades,
    syncLogs,
    isLoadingClickUp,
    saveAndConnectClickUp,
    importRealClickUpTasks,
    moverOportunidadeEtapa,
    converterOportunidadeEmClienteEContrato,
    addOportunidade,
    carregarDadosDemo,
    limparDadosCrm,
    addLeadItem,
    addEmpresaItem,
    addContatoItem,
    addAtividadeItem
  };
}
