export interface ClickUpUserResponse {
  user: {
    id: number;
    username: string;
    email: string;
    color?: string;
    profilePicture?: string;
  };
}

export interface ClickUpTeam {
  id: string;
  name: string;
  color?: string;
  avatar?: string;
  members: Array<{
    user: {
      id: number;
      username: string;
      email: string;
      profilePicture?: string;
    };
  }>;
}

export interface ClickUpSpace {
  id: string;
  name: string;
  private?: boolean;
  statuses?: Array<{
    status: string;
    type: string;
    orderindex: number;
    color: string;
  }>;
}

export interface ClickUpList {
  id: string;
  name: string;
  orderindex?: number;
  content?: string;
  status?: {
    status: string;
    color: string;
  };
  statuses?: Array<{
    status: string;
    orderindex: number;
    color: string;
    type: string;
  }>;
}

export interface ClickUpCustomField {
  id: string;
  name: string;
  type: string;
  value?: any;
}

export interface ClickUpTaskReal {
  id: string;
  custom_id?: string | null;
  name: string;
  text_content?: string;
  description?: string;
  status: {
    status: string;
    color?: string;
    orderindex?: number;
    type?: string;
  };
  orderindex?: string;
  date_created?: string;
  date_updated?: string;
  date_closed?: string;
  due_date?: string;
  start_date?: string;
  points?: number;
  time_estimate?: number;
  custom_fields?: ClickUpCustomField[];
  assignees?: Array<{
    id: number;
    username: string;
    email: string;
    color?: string;
    profilePicture?: string;
  }>;
  tags?: Array<{ name: string; tag_fg?: string; tag_bg?: string }>;
  priority?: {
    priority: string;
    color: string;
  };
  url?: string;
}

export interface ClickUpTasksResponse {
  tasks: ClickUpTaskReal[];
}

const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';

/**
 * Valida a chave de API do ClickUp testando o endpoint GET /user
 */
export async function testClickUpConnection(apiToken: string): Promise<ClickUpUserResponse> {
  if (!apiToken || !apiToken.trim()) {
    throw new Error('API Token do ClickUp é obrigatório.');
  }

  const response = await fetch(`${CLICKUP_API_BASE}/user`, {
    method: 'GET',
    headers: {
      'Authorization': apiToken.trim(),
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('API Token inválido ou não autorizado no ClickUp. Verifique sua chave (pk_...).');
    }
    throw new Error(`Falha ao conectar com o ClickUp (Status HTTP ${response.status}).`);
  }

  const data: ClickUpUserResponse = await response.json();
  return data;
}

/**
 * Busca todos os Workspaces / Teams aos quais o usuário tem acesso
 */
export async function fetchClickUpTeams(apiToken: string): Promise<ClickUpTeam[]> {
  const response = await fetch(`${CLICKUP_API_BASE}/team`, {
    method: 'GET',
    headers: {
      'Authorization': apiToken.trim(),
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar Workspaces no ClickUp (HTTP ${response.status}).`);
  }

  const data = await response.json();
  return data.teams || [];
}

/**
 * Busca todos os Spaces de um Team/Workspace
 */
export async function fetchClickUpSpaces(teamId: string, apiToken: string): Promise<ClickUpSpace[]> {
  const response = await fetch(`${CLICKUP_API_BASE}/team/${teamId.trim()}/space?archived=false`, {
    method: 'GET',
    headers: {
      'Authorization': apiToken.trim(),
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar Spaces do Workspace ${teamId} no ClickUp (HTTP ${response.status}).`);
  }

  const data = await response.json();
  return data.spaces || [];
}

/**
 * Busca todas as Listas (quadros) dentro de um Space (incluindo listas avulsas e em pastas)
 */
export async function fetchClickUpListsInSpace(spaceId: string, apiToken: string): Promise<ClickUpList[]> {
  const allLists: ClickUpList[] = [];

  // 1. Listas avulsas no Space (folderless)
  try {
    const respFolderless = await fetch(`${CLICKUP_API_BASE}/space/${spaceId.trim()}/list?archived=false`, {
      method: 'GET',
      headers: {
        'Authorization': apiToken.trim(),
        'Content-Type': 'application/json'
      }
    });

    if (respFolderless.ok) {
      const dataFolderless = await respFolderless.json();
      if (Array.isArray(dataFolderless.lists)) {
        allLists.push(...dataFolderless.lists);
      }
    }
  } catch (e) {
    console.warn('Erro ao buscar listas folderless:', e);
  }

  // 2. Listas dentro de Pastas no Space
  try {
    const respFolders = await fetch(`${CLICKUP_API_BASE}/space/${spaceId.trim()}/folder?archived=false`, {
      method: 'GET',
      headers: {
        'Authorization': apiToken.trim(),
        'Content-Type': 'application/json'
      }
    });

    if (respFolders.ok) {
      const dataFolders = await respFolders.json();
      if (Array.isArray(dataFolders.folders)) {
        for (const f of dataFolders.folders) {
          if (Array.isArray(f.lists)) {
            allLists.push(...f.lists.map((l: any) => ({ ...l, name: `${f.name} / ${l.name}` })));
          }
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao buscar pastas de listas:', e);
  }

  return allLists;
}

/**
 * Busca todas as tarefas reais de uma List ID no ClickUp com custom fields, assignees e tags
 */
export async function fetchClickUpTasks(listId: string, apiToken: string): Promise<ClickUpTaskReal[]> {
  if (!listId || !apiToken) {
    throw new Error('List ID e API Token são obrigatórios para buscar tarefas do ClickUp.');
  }

  const response = await fetch(`${CLICKUP_API_BASE}/list/${listId.trim()}/task?include_closed=true&subtasks=true`, {
    method: 'GET',
    headers: {
      'Authorization': apiToken.trim(),
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar tarefas da Lista ${listId} no ClickUp (HTTP ${response.status}).`);
  }

  const data: ClickUpTasksResponse = await response.json();
  return data.tasks || [];
}

/**
 * Cria uma nova tarefa real no ClickUp
 */
export async function createClickUpTask(
  listId: string, 
  apiToken: string, 
  taskData: { 
    name: string; 
    description?: string; 
    status?: string; 
    priority?: number; 
    due_date?: number;
    tags?: string[];
  }
): Promise<ClickUpTaskReal> {
  const bodyPayload: Record<string, any> = {
    name: taskData.name,
    description: taskData.description || 'Criado via Focus CRM',
    status: taskData.status || 'open'
  };

  if (taskData.priority) bodyPayload.priority = taskData.priority;
  if (taskData.due_date) bodyPayload.due_date = taskData.due_date;
  if (taskData.tags && taskData.tags.length > 0) bodyPayload.tags = taskData.tags;

  const response = await fetch(`${CLICKUP_API_BASE}/list/${listId.trim()}/task`, {
    method: 'POST',
    headers: {
      'Authorization': apiToken.trim(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyPayload)
  });

  if (!response.ok) {
    throw new Error(`Erro ao criar tarefa no ClickUp (HTTP ${response.status}).`);
  }

  return await response.json();
}

/**
 * Atualiza o status/etapa de uma tarefa real no ClickUp
 */
export async function updateClickUpTaskStatus(taskId: string, apiToken: string, status: string): Promise<void> {
  const response = await fetch(`${CLICKUP_API_BASE}/task/${taskId.trim()}`, {
    method: 'PUT',
    headers: {
      'Authorization': apiToken.trim(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: status.toLowerCase()
    })
  });

  if (!response.ok) {
    console.warn(`Aviso ao atualizar status da tarefa ${taskId} no ClickUp: HTTP ${response.status}`);
  }
}
