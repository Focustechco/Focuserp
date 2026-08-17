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
  const { data: projetos } = useLocalStorageState<Projeto>('focus_projetos', []);

  // Coleções de Engenharia e Delivery
  const {
    data: backlogItems,
    addItem: addBacklogItem,
    updateItem: updateBacklogItem,
    deleteItem: deleteBacklogItem,
    save: saveBacklog,
  } = useLocalStorageState<ItemBacklog>('focus_dev_backlog', []);

  const {
    data: sprints,
    addItem: addSprint,
    updateItem: updateSprint,
    save: saveSprints,
  } = useLocalStorageState<SprintDelivery>('focus_dev_sprints', []);

  const {
    data: versoes,
    addItem: addVersao,
    save: saveVersoes,
  } = useLocalStorageState<VersaoSemVer>('focus_dev_versions', []);

  const {
    data: repositóriosGit,
    addItem: addRepositorioGit,
    updateItem: updateRepositorioGit,
    save: saveGit,
  } = useLocalStorageState<RepositorioGitConfig>('focus_dev_git', []);

  const {
    data: branches,
    addItem: addBranch,
    save: saveBranches,
  } = useLocalStorageState<GitBranchItem>('focus_dev_branches', []);

  const {
    data: releases,
    addItem: addRelease,
    save: saveReleases,
  } = useLocalStorageState<ReleaseDelivery>('focus_dev_releases', []);

  const {
    data: deploys,
    addItem: addDeploy,
    save: saveDeploys,
  } = useLocalStorageState<DeployItem>('focus_dev_deploys', []);

  const {
    data: casosQA,
    addItem: addCasoQA,
    updateItem: updateCasoQA,
    save: saveQA,
  } = useLocalStorageState<CasoTesteQA>('focus_dev_qa', []);

  const {
    data: bugs,
    addItem: addBug,
    updateItem: updateBug,
    save: saveBugs,
  } = useLocalStorageState<BugItem>('focus_dev_bugs', []);

  const {
    data: correcoes,
    addItem: addCorrecao,
    save: saveCorrecoes,
  } = useLocalStorageState<CorrecaoBugItem>('focus_dev_fixes', []);

  const {
    data: ambientes,
    addItem: addAmbiente,
    updateItem: updateAmbiente,
    save: saveAmbientes,
  } = useLocalStorageState<AmbienteInfo>('focus_dev_ambientes', []);

  const {
    data: publicacoes,
    addItem: addPublicacao,
    save: savePublicacoes,
  } = useLocalStorageState<PublicacaoApp>('focus_dev_publicacoes', []);

  const {
    data: logsDelivery,
    addItem: addLogDelivery,
    save: saveLogs,
  } = useLocalStorageState<LogDelivery>('focus_dev_logs', []);

  const {
    data: pipelines,
    addItem: addPipeline,
    updateItem: updatePipeline,
    save: savePipelines,
  } = useLocalStorageState<PipelineCICD>('focus_dev_pipelines', []);

  // Filtrar Projetos Técnicos Eligíveis originados do módulo Projetos
  const projetosTecnicos = projetos.filter(
    (p) =>
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

  // Inicialização Automática de Workspaces Técnicos para Projetos Eligíveis sem dados prévios
  useEffect(() => {
    if (projetosTecnicos.length === 0) return;

    let updatedBacklog = [...backlogItems];
    let updatedSprints = [...sprints];
    let updatedGit = [...repositóriosGit];
    let updatedAmbientes = [...ambientes];
    let updatedPipelines = [...pipelines];
    let hasChanges = false;

    projetosTecnicos.forEach((proj) => {
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
          responsavel: proj.responsavelPrincipal || 'Tech Lead',
          status: 'Em Andamento',
          velocityEstimado: 34,
          velocityRealizado: 21,
        });

        // 2. Seed Items de Backlog
        updatedBacklog.push(
          {
            id: `bk-${proj.id}-1`,
            projetoId: proj.id,
            tipoItem: 'Épico',
            titulo: 'Modelagem da Arquitetura & Banco de Dados',
            descricao: 'Definição de schemas, tabelas e migrações SQL',
            prioridade: 'Crítica',
            status: 'Concluído',
            responsavel: proj.responsavelPrincipal || 'Tech Lead',
            storyPoints: 8,
            sprintId,
            createdAt: new Date().toISOString(),
          },
          {
            id: `bk-${proj.id}-2`,
            projetoId: proj.id,
            tipoItem: 'Funcionalidade',
            titulo: 'Autenticação & Controle de Acesso JWT',
            descricao: 'Implementação de login, refresh token e papéis de acesso',
            prioridade: 'Alta',
            status: 'Em Desenvolvimento',
            responsavel: 'Dev Senior',
            storyPoints: 5,
            sprintId,
            createdAt: new Date().toISOString(),
          },
          {
            id: `bk-${proj.id}-3`,
            projetoId: proj.id,
            tipoItem: 'História de Usuário',
            titulo: 'Interface de Usuário & Componentes UI',
            descricao: 'Desenvolvimento das telas e formulários reativos',
            prioridade: 'Média',
            status: 'Code Review',
            responsavel: 'UX/UI Designer',
            storyPoints: 5,
            sprintId,
            createdAt: new Date().toISOString(),
          },
          {
            id: `bk-${proj.id}-4`,
            projetoId: proj.id,
            tipoItem: 'Tarefa Técnica',
            titulo: 'Pipeline de CI/CD no GitHub Actions',
            descricao: 'Automação de testes de unidade e deploy em Staging',
            prioridade: 'Alta',
            status: 'QA',
            responsavel: 'DevOps Engineer',
            storyPoints: 3,
            sprintId,
            createdAt: new Date().toISOString(),
          }
        );
      }

      // 3. Seed Git Config
      const projGit = updatedGit.find((g) => g.projetoId === proj.id);
      if (!projGit) {
        hasChanges = true;
        const nameSlug = (proj.nome || 'projeto').toLowerCase().replace(/\s+/g, '-');
        updatedGit.push({
          id: `git-${proj.id}`,
          projetoId: proj.id,
          provedor: 'GitHub',
          nomeRepositorio: nameSlug,
          organizacao: 'focustecnologia',
          urlRepositorio: `https://github.com/focustecnologia/${nameSlug}`,
          branchPrincipal: 'main',
          statusConexao: 'Conectado',
        });
      }

      // 4. Seed Ambientes
      const projAmbientes = updatedAmbientes.filter((a) => a.projetoId === proj.id);
      if (projAmbientes.length === 0) {
        hasChanges = true;
        const slug = (proj.nome || 'projeto').toLowerCase().replace(/\s+/g, '-');
        updatedAmbientes.push(
          {
            id: `amb-dev-${proj.id}`,
            projetoId: proj.id,
            tipo: 'Desenvolvimento',
            url: `https://dev-${slug}.focustecnologia.com.br`,
            status: 'Online',
            versaoAtual: 'v0.9.0-dev',
            ultimoDeploy: new Date().toISOString(),
          },
          {
            id: `amb-stg-${proj.id}`,
            projetoId: proj.id,
            tipo: 'Homologação',
            url: `https://staging-${slug}.focustecnologia.com.br`,
            status: 'Online',
            versaoAtual: 'v1.0.0-rc1',
            ultimoDeploy: new Date().toISOString(),
          },
          {
            id: `amb-prd-${proj.id}`,
            projetoId: proj.id,
            tipo: 'Produção',
            url: `https://${slug}.focustecnologia.com.br`,
            status: 'Online',
            versaoAtual: 'v1.0.0',
            ultimoDeploy: new Date().toISOString(),
          }
        );
      }

      // 5. Seed Pipeline CI/CD
      const projPipelines = updatedPipelines.filter((p) => p.projetoId === proj.id);
      if (projPipelines.length === 0) {
        hasChanges = true;
        updatedPipelines.push({
          id: `pipe-${proj.id}`,
          projetoId: proj.id,
          nomePipeline: 'Production Release Pipeline',
          provedor: 'GitHub Actions',
          ambiente: 'Produção',
          status: 'Sucesso',
          tempoExecucaoSegundos: 142,
          ultimaExecucao: new Date().toISOString(),
          buildNumber: 'Build #104',
        });
      }
    });

    if (hasChanges) {
      saveBacklog(updatedBacklog);
      saveSprints(updatedSprints);
      saveGit(updatedGit);
      saveAmbientes(updatedAmbientes);
      savePipelines(updatedPipelines);
    }
  }, [projetosTecnicos]);

  // Ações de Atualização Kanban & Delivery
  const moverItemKanban = (itemId: string, novoStatus: StatusKanban) => {
    const item = backlogItems.find((b) => b.id === itemId);
    if (!item) return;

    updateBacklogItem(itemId, { status: novoStatus });

    addLogDelivery({
      id: `log-${Date.now()}`,
      projetoId: item.projetoId,
      dataHora: new Date().toISOString(),
      tipoEvento: 'Status',
      usuario: item.responsavel || 'Dev Leader',
      descricao: `Item "${item.titulo}" movido para a coluna [${novoStatus}]`,
    });
  };

  const criarCriarItemBacklog = (item: Omit<ItemBacklog, 'id' | 'createdAt'>) => {
    const newId = `bk-${Date.now()}`;
    const novo: ItemBacklog = {
      ...item,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    addBacklogItem(novo);
  };

  const registrarNovoBug = (bug: Omit<BugItem, 'id' | 'createdAt'>) => {
    const newId = `bug-${Date.now()}`;
    const novoBug: BugItem = {
      ...bug,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    addBug(novoBug);

    addLogDelivery({
      id: `log-${Date.now()}`,
      projetoId: bug.projetoId,
      dataHora: new Date().toISOString(),
      tipoEvento: 'Erro',
      usuario: bug.responsavel || 'QA Tester',
      descricao: `Bug Severidade [${bug.severidade}] reportado: "${bug.titulo}"`,
    });
  };

  const resolverBug = (bugId: string, solucao: string, versao: string, responsavel: string) => {
    const targetBug = bugs.find((b) => b.id === bugId);
    if (!targetBug) return;

    updateBug(bugId, { status: 'Resolvido' });

    addCorrecao({
      id: `fix-${Date.now()}`,
      projetoId: targetBug.projetoId,
      bugId,
      bugTitulo: targetBug.titulo,
      solucao,
      responsavel,
      versao,
      data: new Date().toISOString(),
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
    repositóriosGit,
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
