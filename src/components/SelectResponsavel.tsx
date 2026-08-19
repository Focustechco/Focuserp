import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Usuario } from '@/features/usuarios/types';
import { INITIAL_USUARIOS } from '@/features/usuarios/data/initialData';
import { User, Shield } from 'lucide-react';

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

  const activeUsers = useMemo(() => {
    // 1. Tentar ler do hook
    let list: Usuario[] = (storedUsuarios && Array.isArray(storedUsuarios) && storedUsuarios.length > 0)
      ? storedUsuarios
      : [];

    // 2. Tentar ler diretamente do LocalStorage
    if (list.length === 0 && typeof window !== 'undefined') {
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

    // 3. Fallback garantido para INITIAL_USUARIOS
    if (list.length === 0) {
      list = INITIAL_USUARIOS;
    }

    return list.filter(u => u.status === 'Ativo' || !u.status);
  }, [storedUsuarios]);

  return (
    <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72 z-[9999]">
        {includeAllOption && (
          <SelectItem value="todos">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>{allOptionLabel}</span>
            </div>
          </SelectItem>
        )}

        {allowUnassigned && (
          <SelectItem value="none">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              <span>{unassignedLabel}</span>
            </div>
          </SelectItem>
        )}

        {activeUsers.map((u) => {
          const initials = u.nome
            ? u.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
            : 'U';

          return (
            <SelectItem key={u.id || u.email || u.nome} value={u.nome}>
              <div className="flex items-center gap-2.5 py-0.5">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 border border-primary/20">
                  {initials}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-medium text-xs text-foreground leading-tight">{u.nome}</span>
                  {(u.cargo || u.departamento) && (
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {u.cargo || u.departamento}
                    </span>
                  )}
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
