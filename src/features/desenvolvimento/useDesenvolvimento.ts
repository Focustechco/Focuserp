import { useEffect } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Projeto } from '../projetos/types';
import {
  ItemBacklog,
  SprintDelivery,
  VersaoSemVer,
  RepositorioGitConfig,
  GitBranchItem,
  ReleaseDelivery,
  DeployItem,
  CasoTesteQA,
  BugItem,
  CorrecaoBugItem,
  AmbienteInfo,
  PublicacaoApp,
  LogDelivery,
  PipelineCICD,
  StatusKanban,
} from './types';

export function useDesenvolvimento() {
  const { data: projetos = [] } = useLocalStorageState<Projeto>('focus_projetos', []);

  // Coleções de Engenharia e Delivery
  const {
    data: backlogItems = [],
    addItem: addBacklogItem,
    updateItem: updateBacklogItem,
    deleteItem: deleteBacklogItem,
    save: saveBacklog,
  } = useLocalStorageState<ItemBacklog>('focus_dev_backlog', []);

  const {
    data: sprints = [],
    addItem: addSprint,
    updateItem: updateSprint,
    save: saveSprints,
  } = useLocalStorageState<SprintDelivery>('focus_dev_sprints', []);

  const {
    data: versoes = [],
    addItem: addVersao,
    save: saveVersoes,
  } = useLocalStorageState<VersaoSemVer>('focus_dev_versions', []);

  const {
    data: repositoriosGit = [],
    addItem: addRepositorioGit,
    updateItem: updateRepositorioGit,
    save: saveGit,
  } = useLocalStorageState<RepositorioGitConfig>('focus_dev_git', []);

  const {
    data: branches = [],
    addItem: addBranch,
    save: saveBranches,
  } = useLocalStorageState<GitBranchItem>('focus_dev_branches', []);

  const {
    data: releases = [],
    addItem: addRelease,
    save: saveReleases,
  } = useLocalStorageState<ReleaseDelivery>('focus_dev_releases', []);

  const {
    data: deploys = [],
    addItem: addDeploy,
    save: saveDeploys,
  } = useLocalStorageState<DeployItem>('focus_dev_deploys', []);

  const {
    data: casosQA = [],
    addItem: addCasoQA,
    updateItem: updateCasoQA,
    save: saveQA,
  } = useLocalStorageState<CasoTesteQA>('focus_dev_qa', []);

  const {
    data: bugs = [],
    addItem: addBug,
    updateItem: updateBug,
    save: saveBugs,
  } = useLocalStorageState<BugItem>('focus_dev_bugs', []);

  const {
    data: correcoes = [],
    addItem: addCorrecao,
    save: saveCorrecoes,
  } = useLocalStorageState<CorrecaoBugItem>('focus_dev_fixes', []);

  const {
    data: ambientes = [],
    addItem: addAmbiente,
    updateItem: updateAmbiente,
    save: saveAmbientes,
  } = useLocalStorageState<AmbienteInfo>('focus_dev_ambientes', []);

  const {
    data: publicacoes = [],
    addItem: addPublicacao,
    save: savePublicacoes,
  } = useLocalStorageState<PublicacaoApp>('focus_dev_publicacoes', []);

  const {
    data: logsDelivery = [],
    addItem: addLogDelivery,
    save: saveLogs,
  } = useLocalStorageState<LogDelivery>('focus_dev_logs', []);

  const {
    data: pipelines = [],
    addItem: addPipeline,
    updateItem: updatePipeline,
    save: savePipelines,
  } = useLocalStorageState<PipelineCICD>('focus_dev_pipelines', []);

  // Filtrar Projetos Técnicos Elegíveis originados do módulo Projetos
  const projetosTecnicos = (projetos || []).filter(
    (p) =>
      p &&
      p.tipo !== 'Consultoria' &&
      (p.tipo === 'Software Sob Medida' ||
        p.tipo === 'Sistema Web' ||
        p.tipo === 'Sistema Integrado' ||
        p.tipo === 'Aplicativo Mobile' ||
        p.tipo === 'Automação' ||
        p.tipo === 'Business Intelligence' ||
        p.tipo === 'Dashboard' ||
        p.tipo === 'Inteligência Artificial' ||
        p.tipo === 'API' ||
        p.tipo === 'Integração' ||
        p.tipo === 'E-commerce' ||
        p.tipo === 'Website' ||
        !p.tipo)
  );

  // Inicialização Automática de Workspaces Técnicos para Projetos Elegíveis sem dados prévios
  useEffect(() => {
    if (!projetosTecnicos || projetosTecnicos.length === 0) return;

    let updatedBacklog = [...(backlogItems || [])];
    let updatedSprints = [...(sprints || [])];
    let updatedGit = [...(repositoriosGit || [])];
    let updatedAmbientes = [...(ambientes || [])];
    let updatedPipelines = [...(pipelines || [])];
    let hasChanges = false;

    projetosTecnicos.forEach((proj) => {
      if (!proj || !proj.id) return;

      // 1. Seed Sprint se não existir
      const projSprints = updatedSprints.filter((s) => s.projetoId === proj.id);
      if (projSprints.length === 0) {
        hasChanges = true;
        const sprintId = `sprint-${proj.id}-1`;
        updatedSprints.push({
          id: sprintId,
          projetoId: proj.id,
          nome: `Sprint 1 - Início & Arquitetura ${proj.codigo}`,
          objetivo: `Setup inicial da arquitetura, banco de dados e prototipação de ${proj.nome}`,
          dataInicio: proj.dataInicio || new Date().toISOString().split('T')[0],
          dataFim: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          status: 'Em Andamento',
          totalPontosEstimados: 40,
          totalPontosEntregues: 18,
          taxaConclusao: 45,
        });

        // Seed Tarefas Iniciais do Backlog
        const tasks = [
          {
            titulo: 'Modelagem do Banco de Dados & Schemas PostgreSQL',
            tipo: 'User Story' as const,
            status: 'Concluído' as StatusKanban,
            pontos: 8,
            prioridade: 'Alta' as const,
            responsavel: proj.responsavelPrincipal || 'Tech Lead',
          },
          {
            titulo: 'Implementação dos Endpoints REST & Autenticação JWT',
            tipo: 'Feature' as const,
            status: 'Em Desenvolvimento' as StatusKanban,
            pontos: 13,
            prioridade: 'Alta' as const,
            responsavel: 'Engenheiro Backend',
          },
          {
            titulo: 'Desenvolvimento do Painel Frontend Responsivo',
            tipo: 'Feature' as const,
            status: 'A Fazer' as StatusKanban,
            pontos: 13,
            prioridade: 'Média' as const,
            responsavel: 'Engenheiro Frontend',
          },
          {
            titulo: 'Configuração da Esteira de CI/CD e Ambientes Cloud',
            tipo: 'DevOps' as const,
            status: 'Code Review' as StatusKanban,
            pontos: 5,
            prioridade: 'Média' as const,
            responsavel: 'DevOps Lead',
          },
        ];

        tasks.forEach((t, idx) => {
          updatedBacklog.push({
            id: `item-${proj.id}-${idx + 1}`,
            projetoId: proj.id,
            sprintId,
            codigo: `${proj.codigo}-ENG-${idx + 101}`,
            titulo: t.titulo,
            descricao: `Implementação técnica para entrega dos marcos de ${proj.nome}.`,
            tipo: t.tipo,
            status: t.status,
            prioridade: t.prioridade,
            storyPoints: t.pontos,
            responsavel: t.responsavel,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
            tags: ['core', 'mvp', 'focus'],
          });
        });
      }

      // 2. Seed Git Repo se não existir
      const projGit = updatedGit.find((g) => g.projetoId === proj.id);
      if (!projGit) {
        hasChanges = true;
        const nameSlug = proj.nome.toLowerCase().replace(/[^a-z0-9]/g, '-');
        updatedGit.push({
          id: `git-${proj.id}`,
          projetoId: proj.id,
          provedor: 'GitHub',
          organizacao: 'focustecnologia',
          nomeRepositorio: nameSlug,
          branchPrincipal: 'main',
          urlRepositorio: `https://github.com/focustecnologia/${nameSlug}`,
          totalCommits: 42,
          totalBranches: 4,
          totalPullRequests: 2,
          ultimoCommit: {
            hash: '7f9a2b1',
            mensagem: 'feat: setup core architecture & services',
            autor: proj.responsavelPrincipal || 'Tech Lead',
            dataHora: new Date().toISOString(),
          },
        });
      }

      // 3. Seed Ambientes
      const projAmbs = updatedAmbientes.filter((a) => a.projetoId === proj.id);
      if (projAmbs.length === 0) {
        hasChanges = true;
        const nameSlug = proj.nome.toLowerCase().replace(/[^a-z0-9]/g, '-');
        updatedAmbientes.push(
          {
            id: `amb-${proj.id}-dev`,
            projetoId: proj.id,
            nomeAmbiente: 'Desenvolvimento',
            tipoAmbiente: 'Development',
            url: `https://dev-${nameSlug}.focustech.dev`,
            versaoDeployada: 'v0.9.0-alpha',
            status: 'Online',
            ultimoDeployEm: new Date().toISOString(),
            responsavel: 'DevOps Lead',
          },
          {
            id: `amb-${proj.id}-stage`,
            projetoId: proj.id,
            nomeAmbiente: 'Homologação (Staging)',
            tipoAmbiente: 'Staging',
            url: `https://stage-${nameSlug}.focustech.dev`,
            versaoDeployada: 'v0.8.2-rc',
            status: 'Online',
            ultimoDeployEm: new Date(Date.now() - 86400000).toISOString(),
            responsavel: 'DevOps Lead',
          },
          {
            id: `amb-${proj.id}-prod`,
            projetoId: proj.id,
            nomeAmbiente: 'Produção',
            tipoAmbiente: 'Production',
            url: `https://${nameSlug}.focustech.com.br`,
            versaoDeployada: 'v0.8.0',
            status: 'Online',
            ultimoDeployEm: new Date(Date.now() - 5 * 86400000).toISOString(),
            responsavel: 'DevOps Lead',
          }
        );
      }

      // 4. Seed Pipelines
      const projPipes = updatedPipelines.filter((p) => p.projetoId === proj.id);
      if (projPipes.length === 0) {
        hasChanges = true;
        updatedPipelines.push({
          id: `pipe-${proj.id}-1`,
          projetoId: proj.id,
          nomePipeline: 'CI / Testes Automatizados & Linter',
          branchGatilho: 'main',
          status: 'Sucesso',
          duracaoSegundos: 94,
          dataExecucao: new Date().toISOString(),
          autor: proj.responsavelPrincipal || 'Tech Lead',
          commitSha: '7f9a2b1',
        });
      }
    });

    if (hasChanges) {
      saveSprints(updatedSprints);
      saveBacklog(updatedBacklog);
      saveGit(updatedGit);
      saveAmbientes(updatedAmbientes);
      savePipelines(updatedPipelines);
    }
  }, [projetosTecnicos]);

  // Ações do Kanban e Delivery
  const moverItemKanban = (itemId: string, novoStatus: StatusKanban) => {
    const item = (backlogItems || []).find((b) => b.id === itemId);
    if (!item) return;

    updateBacklogItem(itemId, {
      status: novoStatus,
      atualizadoEm: new Date().toISOString(),
    });

    addLogDelivery({
      id: `log-${Date.now()}`,
      projetoId: item.projetoId,
      dataHora: new Date().toISOString(),
      tipoEvento: 'Kanban',
      usuario: 'Usuário Conectado',
      descricao: `Tarefa "${item.titulo}" movida para [${novoStatus}]`,
    });
  };

  const criarCriarItemBacklog = (novoItem: Omit<ItemBacklog, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const itemCriado: ItemBacklog = {
      ...novoItem,
      id: `item-${Date.now()}`,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    addBacklogItem(itemCriado);

    addLogDelivery({
      id: `log-${Date.now()}`,
      projetoId: novoItem.projetoId,
      dataHora: new Date().toISOString(),
      tipoEvento: 'Backlog',
      usuario: novoItem.responsavel || 'Tech Lead',
      descricao: `Nova tarefa criada no Backlog: "${novoItem.titulo}"`,
    });
  };

  const registrarNovoBug = (novoBug: Omit<BugItem, 'id' | 'reportadoEm'>) => {
    const bugCriado: BugItem = {
      ...novoBug,
      id: `bug-${Date.now()}`,
      reportadoEm: new Date().toISOString(),
    };
    addBug(bugCriado);

    addLogDelivery({
      id: `log-${Date.now()}`,
      projetoId: novoBug.projetoId,
      dataHora: new Date().toISOString(),
      tipoEvento: 'Bug',
      usuario: novoBug.reportadoPor,
      descricao: `Bug reportado: [${novoBug.severidade}] ${novoBug.titulo}`,
    });
  };

  const resolverBug = (bugId: string, versao: string, responsavel: string) => {
    const targetBug = (bugs || []).find((b) => b.id === bugId);
    if (!targetBug) return;

    updateBug(bugId, {
      status: 'Resolvido',
      resolvidoEm: new Date().toISOString(),
      versaoCorrecao: versao,
    });

    addCorrecao({
      id: `fix-${Date.now()}`,
      bugId,
      projetoId: targetBug.projetoId,
      descricaoCorrecao: `Correção validada e aplicada na versão ${versao}`,
      autorCorrecao: responsavel,
      commitHash: `fix-${Date.now().toString().slice(-6)}`,
      dataHora: new Date().toISOString(),
    });

    addLogDelivery({
      id: `log-${Date.now()}`,
      projetoId: targetBug.projetoId,
      dataHora: new Date().toISOString(),
      tipoEvento: 'Status',
      usuario: responsavel,
      descricao: `Bug "${targetBug.titulo}" resolvido na versão ${versao}`,
    });
  };

  const registrarDeploy = (dep: Omit<DeployItem, 'id' | 'dataHora'>) => {
    const newDeploy: DeployItem = {
      ...dep,
      id: `dep-${Date.now()}`,
      dataHora: new Date().toISOString(),
    };
    addDeploy(newDeploy);

    addLogDelivery({
      id: `log-${Date.now()}`,
      projetoId: dep.projetoId,
      dataHora: new Date().toISOString(),
      tipoEvento: 'Deploy',
      usuario: dep.responsavel,
      descricao: `Deploy realizado no ambiente de [${dep.ambiente}] na versão ${dep.versao}`,
    });
  };

  return {
    projetosTecnicos,
    backlogItems,
    sprints,
    versoes,
    repositoriosGit,
    repositriosGit: repositoriosGit,
    repositóriosGit: repositoriosGit,
    branches,
    releases,
    deploys,
    casosQA,
    bugs,
    correcoes,
    ambientes,
    publicacoes,
    logsDelivery,
    pipelines,
    moverItemKanban,
    criarCriarItemBacklog,
    registrarNovoBug,
    resolverBug,
    registrarDeploy,
    addSprint,
    addVersao,
    addBranch,
    addRelease,
    addCasoQA,
    addPublicacao,
  };
}
