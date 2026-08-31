import { useLocalStorageState } from "@/hooks/useDataStore";
import { 
  ProjectRequirement,
  ProjectBacklogItem,
  ProjectSprint,
  ProjectTask,
  ProjectMilestone,
  ProjectMember,
  ProjectTimeEntry,
  ProjectDeliverable,
  ProjectRisk,
  ProjectActivityLog,
  StatusTask,
  KanbanColumnConfig
} from "./types";
import { Projeto } from "../types";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import { useMemo } from "react";

export function useProjetoWorkspaceStore(projeto: Projeto) {
  const { currentUser } = useAuth();
  const userName = currentUser?.nome || projeto.responsavelPrincipal || "Usuário Focus";
  const projetoId = projeto.id;

  // Stores locais / sincronizados
  const [allRequirements, setAllRequirements] = useLocalStorageState<ProjectRequirement[]>("focus_project_requirements", []);
  const [allBacklogs, setAllBacklogs] = useLocalStorageState<ProjectBacklogItem[]>("focus_project_backlogs", []);
  const [allSprints, setAllSprints] = useLocalStorageState<ProjectSprint[]>("focus_project_sprints", []);
  const [allTasks, setAllTasks] = useLocalStorageState<ProjectTask[]>("focus_project_tasks", []);
  const [allMilestones, setAllMilestones] = useLocalStorageState<ProjectMilestone[]>("focus_project_milestones_v2", []);
  const [allMembers, setAllMembers] = useLocalStorageState<ProjectMember[]>("focus_project_members", []);
  const [allTimeEntries, setAllTimeEntries] = useLocalStorageState<ProjectTimeEntry[]>("focus_project_time_entries", []);
  const [allDeliverables, setAllDeliverables] = useLocalStorageState<ProjectDeliverable[]>("focus_project_deliverables", []);
  const [allRisks, setAllRisks] = useLocalStorageState<ProjectRisk[]>("focus_project_risks", []);
  const [allLogs, setAllLogs] = useLocalStorageState<ProjectActivityLog[]>("focus_project_activity_logs", []);

  // Filtered by project
  const requirements = useMemo(() => (allRequirements || []).filter(r => r.projetoId === projetoId), [allRequirements, projetoId]);
  const backlogs = useMemo(() => (allBacklogs || []).filter(b => b.projetoId === projetoId), [allBacklogs, projetoId]);
  const sprints = useMemo(() => (allSprints || []).filter(s => s.projetoId === projetoId), [allSprints, projetoId]);
  const tasks = useMemo(() => (allTasks || []).filter(t => t.projetoId === projetoId), [allTasks, projetoId]);
  const milestones = useMemo(() => (allMilestones || []).filter(m => m.projetoId === projetoId), [allMilestones, projetoId]);
  const members = useMemo(() => (allMembers || []).filter(m => m.projetoId === projetoId), [allMembers, projetoId]);
  const timeEntries = useMemo(() => (allTimeEntries || []).filter(te => te.projetoId === projetoId), [allTimeEntries, projetoId]);
  const deliverables = useMemo(() => (allDeliverables || []).filter(d => d.projetoId === projetoId), [allDeliverables, projetoId]);
  const risks = useMemo(() => (allRisks || []).filter(r => r.projetoId === projetoId), [allRisks, projetoId]);
  const logs = useMemo(() => (allLogs || []).filter(l => l.projetoId === projetoId).sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()), [allLogs, projetoId]);

  // LOG HELPER
  const logActivity = (acao: string, entidade: string, detalhes?: string) => {
    const newLog: ProjectActivityLog = {
      id: crypto.randomUUID(),
      projetoId,
      usuarioNome: userName,
      acao,
      entidade,
      detalhes,
      dataHora: new Date().toISOString(),
    };
    setAllLogs((prev = []) => [newLog, ...prev]);
  };

  // --- 1. REQUISITOS (RF, RNF, RT) ---
  const addRequirement = (data: Omit<ProjectRequirement, "id" | "projetoId" | "criadoEm" | "codigo">) => {
    const count = requirements.filter(r => r.tipo === data.tipo).length + 1;
    const prefix = data.tipo === 'Funcional' ? 'RF' : data.tipo === 'Não Funcional' ? 'RNF' : 'RT';
    const codigo = `${prefix}-${String(count).padStart(3, '0')}`;

    const newReq: ProjectRequirement = {
      id: crypto.randomUUID(),
      projetoId,
      codigo,
      ...data,
      criadoEm: new Date().toISOString(),
    };
    setAllRequirements((prev = []) => [newReq, ...prev]);
    logActivity(`Criou o requisito ${codigo}: "${data.titulo}"`, "Requisitos");
    toast.success(`Requisito ${codigo} criado com sucesso!`);
    return newReq;
  };

  const updateRequirement = (id: string, partial: Partial<ProjectRequirement>) => {
    setAllRequirements((prev = []) => prev.map(r => r.id === id ? { ...r, ...partial } : r));
    logActivity(`Atualizou o requisito`, "Requisitos");
    toast.success("Requisito atualizado!");
  };

  const deleteRequirement = (id: string) => {
    setAllRequirements((prev = []) => prev.filter(r => r.id !== id));
    logActivity(`Excluiu um requisito`, "Requisitos");
    toast.success("Requisito excluído.");
  };

  // --- 2. BACKLOG ---
  const addBacklogItem = (data: Omit<ProjectBacklogItem, "id" | "projetoId" | "criadoEm" | "codigo">) => {
    const count = backlogs.length + 1;
    const codigo = `BKG-${String(count).padStart(2, '0')}`;

    const newItem: ProjectBacklogItem = {
      id: crypto.randomUUID(),
      projetoId,
      codigo,
      ...data,
      criadoEm: new Date().toISOString(),
    };
    setAllBacklogs((prev = []) => [newItem, ...prev]);
    logActivity(`Criou item no Backlog ${codigo}: "${data.titulo}"`, "Backlog");
    toast.success(`Item ${codigo} adicionado ao Backlog!`);
    return newItem;
  };

  const updateBacklogItem = (id: string, partial: Partial<ProjectBacklogItem>) => {
    setAllBacklogs((prev = []) => prev.map(b => b.id === id ? { ...b, ...partial } : b));
    logActivity(`Atualizou item de Backlog`, "Backlog");
    toast.success("Item do Backlog atualizado!");
  };

  const deleteBacklogItem = (id: string) => {
    setAllBacklogs((prev = []) => prev.filter(b => b.id !== id));
    logActivity(`Excluiu item de Backlog`, "Backlog");
    toast.success("Item removido do Backlog.");
  };

  const convertBacklogToSprintTask = (backlogId: string, sprintId: string) => {
    const item = backlogs.find(b => b.id === backlogId);
    if (!item) return;

    const count = tasks.length + 1;
    const taskCodigo = `${projeto.codigo || 'PRJ'}-T${String(count).padStart(2, '0')}`;

    const newTask: ProjectTask = {
      id: crypto.randomUUID(),
      projetoId,
      sprintId,
      backlogId: item.id,
      requisitoId: item.requisitoId,
      codigo: taskCodigo,
      titulo: item.titulo,
      descricao: item.descricao,
      responsavel: item.responsavel || projeto.responsavelPrincipal,
      prioridade: item.prioridade,
      status: 'A Fazer',
      tipo: item.tipo === 'Bug' ? 'Bug' : item.tipo === 'Pesquisa' ? 'Pesquisa' : 'Desenvolvimento',
      prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimativaHoras: item.estimativaHoras || 8,
      horasRealizadas: 0,
      tags: ['Backlog Refinado', item.tipo],
      bloqueada: false,
      ordem: tasks.length,
      criadoEm: new Date().toISOString(),
    };

    setAllTasks((prev = []) => [newTask, ...prev]);
    updateBacklogItem(backlogId, { status: 'Em Sprint' });
    logActivity(`Refinou Backlog ${item.codigo} em Task ${taskCodigo} na Sprint`, "Sprints");
    toast.success(`Task ${taskCodigo} criada a partir do Backlog e adicionada à Sprint!`);
  };

  // --- 3. SPRINTS ---
  const addSprint = (data: Omit<ProjectSprint, "id" | "projetoId" | "numero" | "horasRealizadas" | "progresso">) => {
    const numero = sprints.length + 1;
    const newSprint: ProjectSprint = {
      id: crypto.randomUUID(),
      projetoId,
      numero,
      ...data,
      horasRealizadas: 0,
      progresso: 0,
    };
    setAllSprints((prev = []) => [...prev, newSprint]);
    logActivity(`Criou a Sprint ${String(numero).padStart(2, '0')}: "${data.nome}"`, "Sprints");
    toast.success(`Sprint ${String(numero).padStart(2, '0')} criada com sucesso!`);
    return newSprint;
  };

  const updateSprint = (id: string, partial: Partial<ProjectSprint>) => {
    setAllSprints((prev = []) => prev.map(s => s.id === id ? { ...s, ...partial } : s));
    logActivity(`Atualizou a Sprint`, "Sprints");
    toast.success("Sprint atualizada!");
  };

  const deleteSprint = (id: string) => {
    setAllSprints((prev = []) => prev.filter(s => s.id !== id));
    logActivity(`Excluiu uma Sprint`, "Sprints");
    toast.success("Sprint removida.");
  };

  // --- 4. TASKS ---
  const addTask = (data: Omit<ProjectTask, "id" | "projetoId" | "criadoEm" | "codigo">) => {
    const count = tasks.length + 1;
    const codigo = `${projeto.codigo || 'PRJ'}-T${String(count).padStart(2, '0')}`;

    const newTask: ProjectTask = {
      id: crypto.randomUUID(),
      projetoId,
      codigo,
      ...data,
      criadoEm: new Date().toISOString(),
    };
    setAllTasks((prev = []) => [newTask, ...prev]);
    logActivity(`Criou a Task ${codigo}: "${data.titulo}" [${data.status}]`, "Tasks");
    toast.success(`Task ${codigo} criada com sucesso!`);
    return newTask;
  };

  const updateTask = (id: string, partial: Partial<ProjectTask>) => {
    setAllTasks((prev = []) => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...partial };
      if (partial.status && partial.status !== t.status) {
        logActivity(`Moveu a Task ${t.codigo} para ${partial.status}`, "Kanban");
      }
      return updated;
    }));
    toast.success("Task atualizada!");
  };

  const deleteTask = (id: string) => {
    setAllTasks((prev = []) => prev.filter(t => t.id !== id));
    logActivity(`Excluiu uma Task`, "Tasks");
    toast.success("Task excluída.");
  };

  // --- 5. MARCOS (MILESTONES HIERÁRQUICOS) ---
  const addMilestone = (data: Omit<ProjectMilestone, "id" | "projetoId" | "criadoEm">) => {
    const newM: ProjectMilestone = {
      id: crypto.randomUUID(),
      projetoId,
      ...data,
      criadoEm: new Date().toISOString(),
    };
    setAllMilestones((prev = []) => [newM, ...prev]);
    logActivity(`Criou o Marco "${data.titulo}" (Nível ${data.nivel})`, "Marcos");
    toast.success(`Marco "${data.titulo}" criado!`);
    return newM;
  };

  const updateMilestone = (id: string, partial: Partial<ProjectMilestone>) => {
    setAllMilestones((prev = []) => prev.map(m => m.id === id ? { ...m, ...partial } : m));
    logActivity(`Atualizou o Marco`, "Marcos");
    toast.success("Marco atualizado!");
  };

  const deleteMilestone = (id: string) => {
    setAllMilestones((prev = []) => prev.filter(m => m.id !== id));
    logActivity(`Excluiu um Marco`, "Marcos");
    toast.success("Marco excluído.");
  };

  // --- 6. EQUIPE ---
  const addMember = (data: Omit<ProjectMember, "id" | "projetoId">) => {
    const newMember: ProjectMember = {
      id: crypto.randomUUID(),
      projetoId,
      ...data,
    };
    setAllMembers((prev = []) => [...prev, newMember]);
    logActivity(`Alocou ${data.nome} como ${data.papelNoProjeto} no projeto`, "Equipe");
    toast.success(`Membro ${data.nome} adicionado à equipe!`);
    return newMember;
  };

  const updateMember = (id: string, partial: Partial<ProjectMember>) => {
    setAllMembers((prev = []) => prev.map(m => m.id === id ? { ...m, ...partial } : m));
    toast.success("Alocação de equipe atualizada!");
  };

  const deleteMember = (id: string) => {
    setAllMembers((prev = []) => prev.filter(m => m.id !== id));
    logActivity(`Desvinculou membro da equipe`, "Equipe");
    toast.success("Membro removido da equipe.");
  };

  // --- 7. APONTAMENTO DE HORAS (TIMESHEET) ---
  const addTimeEntry = (data: Omit<ProjectTimeEntry, "id" | "projetoId" | "criadoEm">) => {
    const newEntry: ProjectTimeEntry = {
      id: crypto.randomUUID(),
      projetoId,
      ...data,
      criadoEm: new Date().toISOString(),
    };
    setAllTimeEntries((prev = []) => [newEntry, ...prev]);

    // Atualiza horas realizadas na task vinculada
    if (data.taskId) {
      setAllTasks((prev = []) => prev.map(t => {
        if (t.id !== data.taskId) return t;
        return { ...t, horasRealizadas: (t.horasRealizadas || 0) + data.horas };
      }));
    }

    logActivity(`Apontou ${data.horas}h no projeto: "${data.descricao}"`, "Horas");
    toast.success(`${data.horas} horas registradas no projeto!`);
    return newEntry;
  };

  const deleteTimeEntry = (id: string) => {
    setAllTimeEntries((prev = []) => prev.filter(te => te.id !== id));
    toast.success("Registro de horas removido.");
  };

  // --- 8. ENTREGAS (DELIVERABLES) ---
  const addDeliverable = (data: Omit<ProjectDeliverable, "id" | "projetoId">) => {
    const newD: ProjectDeliverable = {
      id: crypto.randomUUID(),
      projetoId,
      ...data,
    };
    setAllDeliverables((prev = []) => [newD, ...prev]);
    logActivity(`Cadastrou a entrega "${data.nome}"`, "Entregas");
    toast.success(`Entrega "${data.nome}" cadastrada!`);
    return newD;
  };

  const updateDeliverable = (id: string, partial: Partial<ProjectDeliverable>) => {
    setAllDeliverables((prev = []) => prev.map(d => d.id === id ? { ...d, ...partial } : d));
    toast.success("Entrega atualizada!");
  };

  const deleteDeliverable = (id: string) => {
    setAllDeliverables((prev = []) => prev.filter(d => d.id !== id));
    toast.success("Entrega removida.");
  };

  // --- 9. RISCOS & BLOQUEIOS ---
  const addRisk = (data: Omit<ProjectRisk, "id" | "projetoId" | "criadoEm">) => {
    const newRisk: ProjectRisk = {
      id: crypto.randomUUID(),
      projetoId,
      ...data,
      criadoEm: new Date().toISOString(),
    };
    setAllRisks((prev = []) => [newRisk, ...prev]);
    logActivity(`Cadastrou o risco "${data.titulo}" [Impacto: ${data.impacto}]`, "Riscos");
    toast.success(`Risco registrado com sucesso!`);
    return newRisk;
  };

  const updateRisk = (id: string, partial: Partial<ProjectRisk>) => {
    setAllRisks((prev = []) => prev.map(r => r.id === id ? { ...r, ...partial } : r));
    toast.success("Risco atualizado!");
  };

  const deleteRisk = (id: string) => {
    setAllRisks((prev = []) => prev.filter(r => r.id !== id));
    toast.success("Risco removido.");
  };

  // --- CÁLCULOS DINÂMICOS CONSOLIDADOS ---
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const tasksConcluidas = tasks.filter(t => t.status === 'Concluído').length;
    const tasksEmAndamento = tasks.filter(t => t.status === 'Em Andamento' || t.status === 'Code Review' || t.status === 'Em Teste').length;
    const tasksBloqueadas = tasks.filter(t => t.status === 'Bloqueado' || t.bloqueada).length;
    const todayStr = new Date().toISOString().split('T')[0];
    const tasksAtrasadas = tasks.filter(t => t.status !== 'Concluído' && t.prazo < todayStr).length;

    const totalHorasApontadas = timeEntries.reduce((acc, te) => acc + (te.horas || 0), 0) || projeto.horasRealizadas || 0;
    const horasContratadas = projeto.horasPlanejadas || 120;
    const horasRestantes = Math.max(0, horasContratadas - totalHorasApontadas);

    const totalMilestones = milestones.length;
    const milestonesConcluidos = milestones.filter(m => m.status === 'Concluído').length;

    // Progresso real calculado dinamicamente
    const progressoTasks = totalTasks > 0 ? (tasksConcluidas / totalTasks) * 100 : 0;
    const progressoMilestones = totalMilestones > 0 ? (milestonesConcluidos / totalMilestones) * 100 : 0;
    const progressoGlobal = Math.round(totalTasks > 0 ? progressoTasks : totalMilestones > 0 ? progressoMilestones : projeto.progressoGlobal || 0);

    const activeSprint = sprints.find(s => s.status === 'Ativa') || sprints[0];
    const sprintTasks = activeSprint ? tasks.filter(t => t.sprintId === activeSprint.id) : [];
    const sprintTasksConcluidas = sprintTasks.filter(t => t.status === 'Concluído').length;
    const sprintProgresso = sprintTasks.length > 0 ? Math.round((sprintTasksConcluidas / sprintTasks.length) * 100) : 0;

    // Alertas automatizados
    const alerts: Array<{ id: string; tipo: 'erro' | 'aviso' | 'info'; titulo: string; desc: string }> = [];
    if (tasksBloqueadas > 0) {
      alerts.push({ id: 'alt-block', tipo: 'erro', titulo: `${tasksBloqueadas} Task(s) com Bloqueio Ativo`, desc: 'Existem impedimentos técnicos ou de aprovação do cliente travando a sprint.' });
    }
    if (tasksAtrasadas > 0) {
      alerts.push({ id: 'alt-late', tipo: 'aviso', titulo: `${tasksAtrasadas} Task(s) em Atraso`, desc: 'Prazos estipulados foram ultrapassados. Reavalie a priorização.' });
    }
    if (totalHorasApontadas > horasContratadas * 0.85) {
      alerts.push({ id: 'alt-hours', tipo: 'aviso', titulo: `Consumo de Horas em ${(totalHorasApontadas / horasContratadas * 100).toFixed(0)}%`, desc: `Foram consumidas ${totalHorasApontadas}h das ${horasContratadas}h contratadas.` });
    }

    return {
      totalTasks,
      tasksConcluidas,
      tasksEmAndamento,
      tasksBloqueadas,
      tasksAtrasadas,
      totalHorasApontadas,
      horasContratadas,
      horasRestantes,
      totalMilestones,
      milestonesConcluidos,
      progressoGlobal,
      activeSprint,
      sprintTasks,
      sprintProgresso,
      alerts,
    };
  }, [tasks, timeEntries, milestones, sprints, projeto]);

  // Seed inicial inteligente caso o projeto esteja vazio
  const seedDefaultProjectData = () => {
    if (requirements.length === 0 && tasks.length === 0 && milestones.length === 0) {
      // 1. Criar Macro Marcos
      const m1 = addMilestone({ nivel: 1, titulo: "Fase 1 — Planejamento & Arquitetura", dataPrevisao: "2026-09-15", status: "Concluído", responsavel: projeto.responsavelPrincipal });
      const m2 = addMilestone({ nivel: 1, titulo: "Fase 2 — MVP & Desenvolvimento Core", dataPrevisao: "2026-10-30", status: "Em Andamento", responsavel: projeto.responsavelPrincipal });
      const m3 = addMilestone({ nivel: 1, titulo: "Fase 3 — Homologação & Go-Live", dataPrevisao: "2026-11-20", status: "Pendente", responsavel: projeto.responsavelPrincipal });

      // 2. Criar Requisitos
      const req1 = addRequirement({ tipo: 'Funcional', titulo: 'Autenticação e Controle de Sessão RBAC', descricao: 'Login seguro com JWT, controle de perfis e 2FA.', categoria: 'Segurança', prioridade: 'Essencial', status: 'Aprovado', versao: '1.0' });
      const req2 = addRequirement({ tipo: 'Funcional', titulo: 'Dashboard Executivo com Gráficos em Tempo Real', descricao: 'Painel com KPIs consolidados e filtros dinâmicos.', categoria: 'Frontend', prioridade: 'Essencial', status: 'Em Desenvolvimento', versao: '1.0' });
      const req3 = addRequirement({ tipo: 'Técnico', titulo: 'API Gateway com Rate Limiting e Documentação OpenAPI', descricao: 'Endpoints RESTful padronizados com Swagger.', categoria: 'Backend', prioridade: 'Importante', status: 'Especificado', versao: '1.0' });

      // 3. Criar Sprint Inicial
      const sprint1 = addSprint({ nome: "Sprint 01 — Setup & Auth Core", objetivo: "Arquitetura base, autenticação e telas de cadastro principais.", dataInicio: "2026-09-01", dataFim: "2026-09-14", status: "Ativa", capacidadeHoras: 80, horasPlanejadas: 60, responsavel: projeto.responsavelPrincipal });

      // 4. Criar Tasks
      addTask({ sprintId: sprint1.id, requisitoId: req1.id, marcoId: m1.id, titulo: "Modelagem do Banco de Dados Relacional e Migrações", responsavel: projeto.responsavelPrincipal, prioridade: "Alta", status: "Concluído", tipo: "Desenvolvimento", prazo: "2026-09-05", estimativaHoras: 16, horasRealizadas: 14, diaSemana: "Segunda-feira", tags: ["Backend", "Postgres"], bloqueada: false, ordem: 1 });
      addTask({ sprintId: sprint1.id, requisitoId: req1.id, marcoId: m2.id, titulo: "Implementação de Login, JWT e Middleware de Proteção", responsavel: projeto.responsavelPrincipal, prioridade: "Alta", status: "Em Andamento", tipo: "Desenvolvimento", prazo: "2026-09-10", estimativaHoras: 20, horasRealizadas: 12, diaSemana: "Terça-feira", tags: ["Auth", "Security"], bloqueada: false, ordem: 2 });
      addTask({ sprintId: sprint1.id, requisitoId: req2.id, marcoId: m2.id, titulo: "Criação dos Componentes de UI e Gráficos de Performance", responsavel: projeto.responsavelPrincipal, prioridade: "Média", status: "A Fazer", tipo: "Design", prazo: "2026-09-14", estimativaHoras: 16, horasRealizadas: 0, diaSemana: "Quarta-feira", tags: ["UI", "Recharts"], bloqueada: false, ordem: 3 });

      // 5. Criar Squad
      addMember({ nome: projeto.responsavelPrincipal || "Tech Lead", cargo: "Gerente de Engenharia", papelNoProjeto: "Tech Lead", horasDedicadasSemana: 40, permissao: "Administrador", dataEntrada: "2026-09-01", status: "Ativo" });
    }
  };

  return {
    requirements,
    backlogs,
    sprints,
    tasks,
    milestones,
    members,
    timeEntries,
    deliverables,
    risks,
    logs,
    stats,
    addRequirement,
    updateRequirement,
    deleteRequirement,
    addBacklogItem,
    updateBacklogItem,
    deleteBacklogItem,
    convertBacklogToSprintTask,
    addSprint,
    updateSprint,
    deleteSprint,
    addTask,
    updateTask,
    deleteTask,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    addMember,
    updateMember,
    deleteMember,
    addTimeEntry,
    deleteTimeEntry,
    addDeliverable,
    updateDeliverable,
    deleteDeliverable,
    addRisk,
    updateRisk,
    deleteRisk,
    seedDefaultProjectData,
  };
}
