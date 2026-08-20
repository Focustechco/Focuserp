import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Usuario } from '@/features/usuarios/types';
import { INITIAL_USUARIOS } from '@/features/usuarios/data/initialData';

export const DEFAULT_SYSTEM_USERS: Usuario[] = [
  {
    id: 'usr-101',
    nome: 'Adriano Leal',
    nomeExibicao: 'Adriano Leal',
    email: 'adriano.leal@focustecnologia.com.br',
    cargo: 'CEO / Diretor Executivo',
    departamento: 'Diretoria',
    status: 'Ativo',
    perfil: 'Super Administrador',
    rolesComplementares: ['Financeiro', 'Projetos', 'Comercial'],
    mfaHabilitado: true,
    tentativasFalhas: 0,
    sessoes: [],
    permissoes: {} as any,
    auditoria: []
  },
  {
    id: 'usr-102',
    nome: 'Mariana Costa',
    nomeExibicao: 'Mariana Costa',
    email: 'mariana.costa@focustecnologia.com.br',
    cargo: 'Gerente de Projetos & Operações',
    departamento: 'Engenharia',
    status: 'Ativo',
    perfil: 'Projetos',
    rolesComplementares: ['Operações'],
    mfaHabilitado: true,
    tentativasFalhas: 0,
    sessoes: [],
    permissoes: {} as any,
    auditoria: []
  },
  {
    id: 'usr-103',
    nome: 'Carlos Andrade',
    nomeExibicao: 'Carlos Andrade',
    email: 'carlos.andrade@focustecnologia.com.br',
    cargo: 'Gerente Financeiro & Controller',
    departamento: 'Financeiro',
    status: 'Ativo',
    perfil: 'Administrador Financeiro',
    rolesComplementares: ['Fiscal', 'Tesouraria'],
    mfaHabilitado: true,
    tentativasFalhas: 0,
    sessoes: [],
    permissoes: {} as any,
    auditoria: []
  },
  {
    id: 'usr-104',
    nome: 'Felipe Santos',
    nomeExibicao: 'Felipe Santos',
    email: 'felipe.santos@focustecnologia.com.br',
    cargo: 'Head Comercial & Vendas SaaS',
    departamento: 'Vendas',
    status: 'Ativo',
    perfil: 'Comercial',
    rolesComplementares: ['CRM'],
    mfaHabilitado: false,
    tentativasFalhas: 0,
    sessoes: [],
    permissoes: {} as any,
    auditoria: []
  }
];

interface SelectResponsavelProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  includeAllOption?: boolean;
  allOptionLabel?: string;
  allowUnassigned?: boolean;
  unassignedLabel?: string;
}

export function SelectResponsavel({
  value,
  onValueChange,
  placeholder = "Selecione o Usuário",
  className,
  disabled = false,
  includeAllOption = false,
  allOptionLabel = "Todos os Responsáveis",
  allowUnassigned = false,
  unassignedLabel = "Não Atribuído"
}: SelectResponsavelProps) {
  const { data: storedUsuarios } = useLocalStorageState<Usuario>('focus_usuarios', INITIAL_USUARIOS || DEFAULT_SYSTEM_USERS);

  const usersList = useMemo(() => {
    // 1. Obter lista de usuários
    let list: Usuario[] = [];
    if (storedUsuarios && Array.isArray(storedUsuarios) && storedUsuarios.length > 0) {
      list = storedUsuarios;
    } else if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('focus_app_focus_usuarios') || window.localStorage.getItem('focus_usuarios');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed;
          }
        }
      } catch {}
    }

    if (list.length === 0) {
      list = INITIAL_USUARIOS && INITIAL_USUARIOS.length > 0 ? INITIAL_USUARIOS : DEFAULT_SYSTEM_USERS;
    }

    // 2. Filtrar ativos
    const active = list.filter(u => !u.status || String(u.status).toLowerCase() === 'ativo');
    return active.length > 0 ? active : list;
  }, [storedUsuarios]);

  return (
    <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {includeAllOption && (
          <SelectItem value="todos">{allOptionLabel}</SelectItem>
        )}

        {allowUnassigned && (
          <SelectItem value="none">{unassignedLabel}</SelectItem>
        )}

        {usersList.map((u) => {
          const userRole = u.cargo || u.departamento || 'Usuário';
          return (
            <SelectItem key={u.id || u.nome} value={u.nome}>
              {u.nome} ({userRole})
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
