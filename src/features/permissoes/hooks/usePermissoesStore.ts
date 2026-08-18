import { useLocalStorageState } from "@/hooks/useDataStore";
import { Usuario, UserProfile } from "@/features/usuarios/types";
import { Colaborador } from "@/features/rh/types";
import { PerfilAcesso } from "../types";

const INITIAL_PERFIS: PerfilAcesso[] = [
  {
    id: "p-admin",
    nome: "Super Administrador",
    descricao: "Acesso irrestrito a todos os módulos, configurações, relatórios e governança.",
    departamentoPadrao: "Diretoria",
    totalUsuariosAssociados: 2,
    corBadge: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300",
    permissoes: {} as any
  },
  {
    id: "p-fin-adm",
    nome: "Administrador Financeiro",
    descricao: "Gestão completa de recebimentos, pagamentos, conciliação, DRE, tesouraria e relatórios.",
    departamentoPadrao: "Financeiro",
    totalUsuariosAssociados: 4,
    corBadge: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
    permissoes: {} as any
  },
  {
    id: "p-comercial",
    nome: "Comercial",
    descricao: "Acesso a Clientes, Contratos, Cobranças e relatórios comerciais.",
    departamentoPadrao: "Comercial",
    totalUsuariosAssociados: 6,
    corBadge: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300",
    permissoes: {} as any
  },
  {
    id: "p-projetos",
    nome: "Projetos",
    descricao: "Gestão de Projetos, escopos, entregáveis, horas e integração ClickUp.",
    departamentoPadrao: "Operações",
    totalUsuariosAssociados: 3,
    corBadge: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
    permissoes: {} as any
  }
];

export function usePermissoesStore() {
  const { data: usuarios, updateItem: updateUsuario } = useLocalStorageState<Usuario>("focus_usuarios");
  const { data: colaboradores, updateItem: updateColaborador } = useLocalStorageState<Colaborador>("focus_rh_colaboradores");
  const { data: perfis, updateItem: updatePerfil, addItem: addPerfilItem } = useLocalStorageState<PerfilAcesso>("focus_permissoes_perfis", INITIAL_PERFIS);

  // Sincronizador de Setor, Cargo e Perfil em Tempo Real
  const updateColaboradorSetorECargo = (
    usuarioId: string, 
    novoSetorDepartamento: string, 
    novoCargo: string, 
    novoPerfil: UserProfile
  ) => {
    const targetUser = usuarios.find(u => u.id === usuarioId || ((u?.email || '').toLowerCase() === (usuarioId || '').toLowerCase() && u?.email));
    
    if (targetUser) {
      updateUsuario(targetUser.id, {
        departamento: novoSetorDepartamento,
        cargo: novoCargo,
        perfil: novoPerfil
      });
    }

    // Procura o colaborador correspondente no módulo RH
    const targetColab = colaboradores.find(c => 
      c.usuarioVinculadoId === usuarioId || 
      ((c?.email || '').toLowerCase() === (targetUser?.email || '').toLowerCase() && targetUser?.email) ||
      ((c?.nomeCompleto || '').toLowerCase() === (targetUser?.nome || '').toLowerCase() && targetUser?.nome)
    );

    if (targetColab) {
      updateColaborador(targetColab.id, {
        departamento: novoSetorDepartamento,
        setor: novoSetorDepartamento,
        cargo: novoCargo
      });
    }
  };

  return {
    usuarios,
    colaboradores,
    perfis,
    updateColaboradorSetorECargo,
    updatePerfil,
    addPerfilItem
  };
}
