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
  members?: Array<{
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

export interface ClickUpView {
  id: string;
  name: string;
  type: string; // 'board', 'list', 'table', etc.
  parent?: {
    id: string;
    type: number;
  };
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

export interface ClickUpBoardOption {
  id: string;
  name: string;
  kind: 'list' | 'view' | 'space';
  spaceName?: string;
  folderName?: string;
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
 * Busca Views criadas no nível do Workspace (Team)
 */
export async function fetchClickUpTeamViews(teamId: string, apiToken: string): Promise<ClickUpView[]> {
  try {
    const resp = await fetch(`${CLICKUP_API_BASE}/team/${teamId.trim()}/view`, {
      method: 'GET',
      headers: {
        'Authorization': apiToken.trim(),
        'Content-Type': 'application/json'
      }
    });
    if (resp.ok) {
      const data = await resp.json();
      return data.views || [];
    }
  } catch (e) {
    console.warn('Erro ao buscar views do team:', e);
  }
  return [];
}

/**
 * Busca Views criadas no nível do Space
 */
export async function fetchClickUpSpaceViews(spaceId: string, apiToken: string): Promise<ClickUpView[]> {
  try {
    const resp = await fetch(`${CLICKUP_API_BASE}/space/${spaceId.trim()}/view`, {
      method: 'GET',
      headers: {
        'Authorization': apiToken.trim(),
        'Content-Type': 'application/json'
      }
    });
    if (resp.ok) {
      const data = await resp.json();
      return data.views || [];
    }
  } catch (e) {
    console.warn('Erro ao buscar views do space:', e);
  }
  return [];
}

/**
 * Busca todas as Listas e Quadros/Views disponíveis em um Workspace/Spaces
 */
export async function fetchAllClickUpBoardsAndLists(
  teamId: string, 
  apiToken: string
): Promise<ClickUpBoardOption[]> {
  const options: ClickUpBoardOption[] = [];
  const token = apiToken.trim();

  // 1. Views a nível de Workspace / Team (ex: quadros globais)
  const teamViews = await fetchClickUpTeamViews(teamId, token);
  for (const v of teamViews) {
    options.push({
      id: v.id,
      name: `Quadro Geral: ${v.name || 'Visão Workspace'} (${v.type || 'board'})`,
      kind: 'view'
    });
  }

  // 2. Buscar Spaces do Workspace
  let spaces: ClickUpSpace[] = [];
  try {
    spaces = await fetchClickUpSpaces(teamId, token);
  } catch (e) {
    console.warn('Erro ao buscar spaces:', e);
  }

  for (const sp of spaces) {
    // 2.1 Views no nível do Space
    const spaceViews = await fetchClickUpSpaceViews(sp.id, token);
    for (const sv of spaceViews) {
      options.push({
        id: sv.id,
        name: `[${sp.name}] Quadro: ${sv.name} (${sv.type || 'board'})`,
        kind: 'view',
        spaceName: sp.name
      });
    }

    // 2.2 Listas avulsas no Space (folderless)
    try {
      const respFolderless = await fetch(`${CLICKUP_API_BASE}/space/${sp.id}/list?archived=false`, {
        headers: { 'Authorization': token, 'Content-Type': 'application/json' }
      });
      if (respFolderless.ok) {
        const dataFolderless = await respFolderless.json();
        if (Array.isArray(dataFolderless.lists)) {
          for (const l of dataFolderless.lists) {
            options.push({
              id: l.id,
              name: `[${sp.name}] Lista: ${l.name}`,
              kind: 'list',
              spaceName: sp.name
            });
          }
        }
      }
    } catch (e) {}

    // 2.3 Listas dentro de Pastas
    try {
      const respFolders = await fetch(`${CLICKUP_API_BASE}/space/${sp.id}/folder?archived=false`, {
        headers: { 'Authorization': token, 'Content-Type': 'application/json' }
      });
      if (respFolders.ok) {
        const dataFolders = await respFolders.json();
        if (Array.isArray(dataFolders.folders)) {
          for (const f of dataFolders.folders) {
            if (Array.isArray(f.lists)) {
              for (const fl of f.lists) {
                options.push({
                  id: fl.id,
                  name: `[${sp.name} / ${f.name}] Lista: ${fl.name}`,
                  kind: 'list',
                  spaceName: sp.name,
                  folderName: f.name
                });
              }
            }
          }
        }
      }
    } catch (e) {}
  }

  return options;
}

/**
 * Normaliza o ID fornecido (caso seja URL completa do ClickUp ou ID com formato especial)
 */
export function extractCleanClickUpId(input: string): string {
  if (!input) return '';
  let str = input.trim();

  // Se o usuário colou a URL completa do ClickUp
  // Ex: https://app.clickup.com/901323318822/v/b/6-901323318822-2
  // Ex: https://app.clickup.com/901323318822/v/l/li/901305412852
  if (str.includes('clickup.com')) {
    const matchView = str.match(/\/v\/[a-z]\/([a-zA-Z0-9_-]+)/);
    const matchList = str.match(/\/li\/([0-9]+)/);
    if (matchView && matchView[1]) return matchView[1];
    if (matchList && matchList[1]) return matchList[1];
    
    const parts = str.split('/').filter(Boolean);
    return parts[parts.length - 1];
  }

  return str;
}

/**
 * Busca todas as tarefas reais de um Quadro (View) ou Lista (List) no ClickUp de forma inteligente e resiliente
 */
export async function fetchClickUpTasks(targetId: string, apiToken: string): Promise<ClickUpTaskReal[]> {
  if (!targetId || !apiToken) {
    throw new Error('ID do Quadro/Lista e API Token são obrigatórios para buscar tarefas do ClickUp.');
  }

  const cleanId = extractCleanClickUpId(targetId);
  const token = apiToken.trim();
  const isViewFormat = cleanId.startsWith('6-') || cleanId.startsWith('v/') || cleanId.includes('-');

  // 1. Se tem formato de View (ex: 6-901323318822-2), buscar no endpoint de View
  if (isViewFormat) {
    try {
      const resp = await fetch(`${CLICKUP_API_BASE}/view/${cleanId}/task?page=0`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.tasks)) return data.tasks;
        if (data.data && Array.isArray(data.data.tasks)) return data.data.tasks;
      }
    } catch (e) {
      console.warn('Tentativa via view falhou, tentando fallback:', e);
    }
  }

  // 2. Buscar no endpoint de List
  try {
    const respList = await fetch(`${CLICKUP_API_BASE}/list/${cleanId}/task?include_closed=true&subtasks=true`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    if (respList.ok) {
      const data = await respList.json();
      if (Array.isArray(data.tasks)) return data.tasks;
    }
  } catch (e) {
    console.warn('Tentativa via list falhou:', e);
  }

  // 3. Fallback View se não foi tentado antes
  if (!isViewFormat) {
    try {
      const respView = await fetch(`${CLICKUP_API_BASE}/view/${cleanId}/task?page=0`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (respView.ok) {
        const data = await respView.json();
        if (Array.isArray(data.tasks)) return data.tasks;
        if (data.data && Array.isArray(data.data.tasks)) return data.data.tasks;
      }
    } catch (e) {}
  }

  // 4. Fallback Team/Workspace Tasks se cleanId for team
  try {
    const respTeam = await fetch(`${CLICKUP_API_BASE}/team/${cleanId}/task?include_closed=true&page=0`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    if (respTeam.ok) {
      const data = await respTeam.json();
      if (Array.isArray(data.tasks)) return data.tasks;
    }
  } catch (e) {}

  throw new Error(`Não foi possível carregar as tarefas do ClickUp para o ID "${cleanId}". Verifique se sua chave possui permissão no quadro.`);
}

/**
 * Cria uma nova tarefa real no ClickUp
 */
export async function createClickUpTask(
  targetId: string, 
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
  const cleanId = extractCleanClickUpId(targetId);
  const token = apiToken.trim();

  const bodyPayload: Record<string, any> = {
    name: taskData.name,
    description: taskData.description || 'Criado via Focus CRM',
    status: taskData.status || 'open'
  };

  if (taskData.priority) bodyPayload.priority = taskData.priority;
  if (taskData.due_date) bodyPayload.due_date = taskData.due_date;
  if (taskData.tags && taskData.tags.length > 0) bodyPayload.tags = taskData.tags;

  const response = await fetch(`${CLICKUP_API_BASE}/list/${cleanId}/task`, {
    method: 'POST',
    headers: {
      'Authorization': token,
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
  const cleanId = taskId.replace('CU-', '').trim();
  const token = apiToken.trim();

  const response = await fetch(`${CLICKUP_API_BASE}/task/${cleanId}`, {
    method: 'PUT',
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: status.toLowerCase()
    })
  });

  if (!response.ok) {
    console.warn(`Aviso ao atualizar status da tarefa ${cleanId} no ClickUp: HTTP ${response.status}`);
  }
}
