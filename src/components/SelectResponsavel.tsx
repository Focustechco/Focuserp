import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Usuario } from '@/features/usuarios/types';
import { INITIAL_USUARIOS } from '@/features/usuarios/data/initialData';
import { safeGetItem } from '@/lib/safeStorage';

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
  const { data: storedUsuarios } = useLocalStorageState<Usuario>('focus_usuarios', INITIAL_USUARIOS);

  const usersList = useMemo(() => {
    let list: Usuario[] = [];
    if (storedUsuarios && Array.isArray(storedUsuarios) && storedUsuarios.length > 0) {
      list = storedUsuarios;
    } else {
      try {
        const raw = safeGetItem('focus_app_focus_usuarios') || safeGetItem('focus_usuarios');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed;
          }
        }
      } catch {}
    }

    if (list.length === 0) {
      list = INITIAL_USUARIOS;
    }

    // Filtrar ativos
    const active = list.filter(u => !u.status || String(u.status).toLowerCase() === 'ativo');
    return active.length > 0 ? active : list;
  }, [storedUsuarios]);

  return (
    <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72 z-[9999]">
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
