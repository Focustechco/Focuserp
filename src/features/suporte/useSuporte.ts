import { useLocalStorageState } from '@/hooks/useDataStore';
import { DEFAULT_KB_ARTICLES, DEFAULT_TICKETS } from './defaultData';
import {
  ChamadoSuporte,
  MensagemChamado,
  TimelineSuporte,
  ArtigoConhecimento,
  TipoChamado,
  StatusChamado,
  PrioridadeChamado,
} from './types';
import { Cliente } from '../clientes/types';
import { ProdutoFocus } from '../produtos/types';
import { Projeto } from '../projetos/types';
import { CsCustomer } from '../customerSuccess/types';
import { ItemBacklog, BugItem } from '../desenvolvimento/types';

export function useSuporte() {
  const {
    data: chamados,
    addItem: addChamado,
    updateItem: updateChamado,
    deleteItem: deleteChamado,
    save: saveChamados,
  } = useLocalStorageState<ChamadoSuporte>('focus_suporte_chamados', DEFAULT_TICKETS);

  const {
    data: artigosKB,
    addItem: addArtigoKB,
    updateItem: updateArtigoKB,
    save: saveKB,
  } = useLocalStorageState<ArtigoConhecimento>('focus_suporte_kb', DEFAULT_KB_ARTICLES);

  const {
    data: mensagens,
    addItem: addMensagem,
    save: saveMensagens,
  } = useLocalStorageState<MensagemChamado>('focus_suporte_mensagens', [
    {
      id: 'msg-1',
      chamadoId: 'tk-1001',
      autorNome: 'Carlos Andrade (CTO)',
      autorPapel: 'Cliente',
      conteudo: 'Ol equipe de suporte! Identificamos que na nota fiscal de servios emitida para SP a alquota saiu 5% em vez de 2%. Podem verificar?',
      tipoMensagem: 'Publico',
      dataHora: '2026-07-24T09:30:00.000Z',
    },
    {
      id: 'msg-2',
      chamadoId: 'tk-1001',
      autorNome: 'Ana Clara (Nvel 2)',
      autorPapel: 'Suporte',
      conteudo: 'Ol Carlos! Analisamos a parametrizao e identificamos que o cdigo do servio no cadastro do item precisa de um ajuste na alquota reduzida. J estamos tratando.',
      tipoMensagem: 'Publico',
      dataHora: '2026-07-24T10:15:00.000Z',
    },
  ]);

  const {
    data: timelineEvents,
    addItem: addTimelineEvent,
    save: saveTimeline,
  } = useLocalStorageState<TimelineSuporte>('focus_suporte_timeline', [
    {
      id: 'tl-1',
      chamadoId: 'tk-1001',
      dataHora: '2026-07-24T09:30:00.000Z',
      tipoEvento: 'Abertura',
      usuario: 'Carlos Andrade (Cliente)',
      descricao: 'Chamado aberto pelo cliente via Portal / E-mail',
    },
    {
      id: 'tl-2',
      chamadoId: 'tk-1001',
      dataHora: '2026-07-24T10:15:00.000Z',
      tipoEvento: 'Atribuio',
      usuario: 'Ana Clara (Suporte)',
      descricao: 'Chamado atribudo a Ana Clara. Primeira resposta registrada.',
    },
  ]);

  // Consumir colees de Clientes, Produtos, Projetos, CS e Dev
  const { data: clientes } = useLocalStorageState<Cliente>('focus_clientes', []);
  const { data: produtos } = useLocalStorageState<ProdutoFocus>('focus_produtos', []);
  const { data: projetos } = useLocalStorageState<Projeto>('focus_projetos', []);
  const { data: csCustomers } = useLocalStorageState<CsCustomer>('focus_cs_customers', []);

  const { data: devBacklog, addItem: addDevBacklogItem } = useLocalStorageState<ItemBacklog>('focus_dev_backlog', []);
  const { data: devBugs, addItem: addDevBugItem } = useLocalStorageState<BugItem>('focus_dev_bugs', []);

  // Criar Novo Chamado no Service Desk
  const abrirNovoChamado = (c: Omit<ChamadoSuporte, 'id' | 'numero' | 'dataAbertura' | 'slaStatus' | 'updatedAt'>) => {
    const nextNum = 1000 + chamados.length + 1;
    const id = `tk-${nextNum}`;
    const numero = `TK-${nextNum}`;

    const dataAbertura = new Date().toISOString();
    const dataLimiteResolucao = new Date(Date.now() + (c.slaHorasResolucao || 24) * 3600000).toISOString();

    const novo: ChamadoSuporte = {
      ...c,
      id,
      numero,
      dataAbertura,
      dataLimiteResolucao,
      slaStatus: 'Em Dia',
      updatedAt: dataAbertura,
    };

    addChamado(novo);

    addTimelineEvent({
      id: `tl-${Date.now()}`,
      chamadoId: id,
      dataHora: dataAbertura,
      tipoEvento: 'Abertura',
      usuario: c.contatoNome || 'Cliente',
      descricao: `Chamado ${numero} aberto com prioridade [${c.prioridade}]`,
    });

    return id;
  };

  // Enviar Mensagem / Resposta em Chamado
  const responderChamado = (
    chamadoId: string,
    conteudo: string,
    tipoMensagem: MensagemChamado['tipoMensagem'],
    autorNome: string = 'Atendente Suporte',
    novoStatus?: StatusChamado
  ) => {
    const chamado = chamados.find((c) => c.id === chamadoId);
    if (!chamado) return;

    const newMsg: MensagemChamado = {
      id: `msg-${Date.now()}`,
      chamadoId,
      autorNome,
      autorPapel: tipoMensagem === 'Nota Interna' ? 'Suporte' : 'Suporte',
      conteudo,
      tipoMensagem,
      dataHora: new Date().toISOString(),
    };
    addMensagem(newMsg);

    const updatePayload: Partial<ChamadoSuporte> = {
      updatedAt: new Date().toISOString(),
    };

    if (!chamado.dataPrimeiraResposta) {
      updatePayload.dataPrimeiraResposta = new Date().toISOString();
    }

    if (novoStatus) {
      updatePayload.status = novoStatus;
      if (novoStatus === 'Resolvido' || novoStatus === 'Fechado') {
        updatePayload.dataResolucao = new Date().toISOString();
        updatePayload.slaStatus = 'Cumprido';
      }
    }

    updateChamado(chamadoId, updatePayload);

    addTimelineEvent({
      id: `tl-${Date.now()}`,
      chamadoId,
      dataHora: new Date().toISOString(),
      tipoEvento: 'Comentrio',
      usuario: autorNome,
      descricao: `Interao adicionada (${tipoMensagem}). Status: ${novoStatus || chamado.status}`,
    });
  };

  // CONVERTER CHAMADO EM TAREFA NO MDULO DESENVOLVIMENTO (INTEGRAO NATIVA SUPORTE -> DEV)
  const converterEmTarefaDev = (chamadoId: string, projetoIdTarget: string) => {
    const chamado = chamados.find((c) => c.id === chamadoId);
    if (!chamado) return;

    const targetProj = projetos.find((p) => p.id === projetoIdTarget);
    const projNome = targetProj ? targetProj.nome : 'Projeto de Software';

    const taskId = `dev-from-tk-${Date.now()}`;
    const taskTitulo = `[Suporte ${chamado.numero}] ${chamado.titulo}`;

    if (chamado.tipo === 'Bug' || chamado.tipo === 'Incidente' || chamado.tipo === 'Correo') {
      // Cria Bug no Mdulo Desenvolvimento
      const newBug: BugItem = {
        id: taskId,
        projetoId: projetoIdTarget,
        titulo: taskTitulo,
        descricao: `Oriundo do Chamado ${chamado.numero} (${chamado.clienteNome}). Descrio: ${chamado.descricao}`,
        severidade: chamado.prioridade === 'Crtica' ? 'Crtico' : chamado.prioridade === 'Alta' ? 'Alto' : 'Mdio',
        prioridade: chamado.prioridade,
        ambiente: 'Produo',
        responsavel: 'Dev Team',
        status: 'Aberto',
        createdAt: new Date().toISOString(),
      };
      addDevBugItem(newBug);
    } else {
      // Cria Item no Backlog
      const newBacklog: ItemBacklog = {
        id: taskId,
        projetoId: projetoIdTarget,
        tipoItem: chamado.tipo === 'Nova Funcionalidade' ? 'Funcionalidade' : 'Melhoria',
        titulo: taskTitulo,
        descricao: `Solicitao do cliente ${chamado.clienteNome} via Chamado ${chamado.numero}. ${chamado.descricao}`,
        prioridade: chamado.prioridade,
        status: 'Backlog',
        responsavel: 'Product Owner',
        storyPoints: 5,
        createdAt: new Date().toISOString(),
      };
      addDevBacklogItem(newBacklog);
    }

    // Atualiza Chamado com vnculo direto
    updateChamado(chamadoId, {
      status: 'Em Desenvolvimento',
      devTaskId: taskId,
      devTaskStatus: 'Em Desenvolvimento',
      devTaskTitulo: taskTitulo,
      githubRepoUrl: `https://github.com/focustecnologia/${projNome.toLowerCase().replace(/\s+/g, '-')}`,
      updatedAt: new Date().toISOString(),
    });

    addTimelineEvent({
      id: `tl-${Date.now()}`,
      chamadoId,
      dataHora: new Date().toISOString(),
      tipoEvento: 'DevSync',
      usuario: 'Suporte Integration',
      descricao: `Demanda de engenharia criada no mdulo Desenvolvimento (Task ID: ${taskId}) para o projeto ${projNome}`,
    });
  };

  // Contexto CS do Cliente do Chamado
  const getCsContextDoCliente = (clienteId: string) => {
    return csCustomers.find((cs) => cs.client_id === clienteId);
  };

  return {
    chamados,
    clientes,
    produtos,
    projetos,
    csCustomers,
    artigosKB,
    mensagens,
    timelineEvents,
    abrirNovoChamado,
    responderChamado,
    converterEmTarefaDev,
    getCsContextDoCliente,
    updateChamado,
    deleteChamado,
    addArtigoKB,
  };
}
