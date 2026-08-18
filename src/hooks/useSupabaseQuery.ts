/**
 * useSupabaseQuery — Hooks centrais React Query para todos os módulos do Focuserp
 * Substitui o useLocalStorageState com cache reativo, invalidação e toasts via sonner
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { clienteService } from '@/services/clienteService';
import { contratoService } from '@/services/contratoService';
import { cobrancaService } from '@/services/cobrancaService';
import { colaboradorService } from '@/services/colaboradorService';
import { contaPagarService } from '@/services/contaPagarService';
import { contaReceberService } from '@/services/contaReceberService';
import { fornecedorService } from '@/services/fornecedorService';
import { projetoService } from '@/services/projetoService';
import { userService } from '@/services/userService';
import { auditLogService } from '@/services/auditLogService';

import type { ClienteDTO } from '@/schemas/clienteSchema';
import type { ContratoDTO } from '@/schemas/contratoSchema';
import type { CobrancaDTO } from '@/schemas/cobrancaSchema';
import type { ColaboradorDTO } from '@/schemas/colaboradorSchema';
import type { ContaPagarDTO } from '@/schemas/contaPagarSchema';
import type { ContaReceberDTO } from '@/schemas/contaReceberSchema';
import type { FornecedorDTO } from '@/schemas/fornecedorSchema';
import type { ProjetoDTO } from '@/schemas/projetoSchema';
import type { UserDTO } from '@/schemas/userSchema';
import type { AuditLogDTO } from '@/schemas/auditLogSchema';

// ─── STALE TIME padronizado ────────────────────────────────────────────────────
const STALE_5MIN = 1000 * 60 * 5;

// ==============================================================================
// 1. CLIENTES
// ==============================================================================
export function useClientesQuery() {
  const queryClient = useQueryClient();

  const query = useQuery<ClienteDTO[]>({
    queryKey: ['clientes'],
    queryFn: () => clienteService.getClientes(),
    staleTime: STALE_5MIN,
  });

  const saveMutation = useMutation({
    mutationFn: (cliente: ClienteDTO) => clienteService.saveCliente(cliente),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente salvo com sucesso!');
    },
    onError: (err: Error) => toast.error(`Erro ao salvar cliente: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clienteService.deleteCliente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente removido com sucesso!');
    },
    onError: (err: Error) => toast.error(`Erro ao remover cliente: ${err.message}`),
  });

  return {
    clientes: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    saveCliente: saveMutation.mutateAsync,
    deleteCliente: deleteMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ==============================================================================
// 2. CONTRATOS
// ==============================================================================
export function useContratosQuery() {
  const queryClient = useQueryClient();

  const query = useQuery<ContratoDTO[]>({
    queryKey: ['contratos'],
    queryFn: () => contratoService.getContratos(),
    staleTime: STALE_5MIN,
  });

  const saveMutation = useMutation({
    mutationFn: (contrato: ContratoDTO) => contratoService.saveContrato(contrato),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      toast.success('Contrato salvo com sucesso!');
    },
    onError: (err: Error) => toast.error(`Erro ao salvar contrato: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contratoService.deleteContrato(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      toast.success('Contrato removido com sucesso!');
    },
    onError: (err: Error) => toast.error(`Erro ao remover contrato: ${err.message}`),
  });

  return {
    contratos: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    saveContrato: saveMutation.mutateAsync,
    deleteContrato: deleteMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ==============================================================================
// 3. COBRANÇAS
// ==============================================================================
export function useCobrancasQuery() {
  const queryClient = useQueryClient();

  const query = useQuery<CobrancaDTO[]>({
    queryKey: ['cobrancas'],
    queryFn: () => cobrancaService.getCobrancas(),
    staleTime: STALE_5MIN,
  });

  const saveMutation = useMutation({
    mutationFn: (cobranca: CobrancaDTO) => cobrancaService.saveCobranca(cobranca),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      toast.success('Cobrança salva com sucesso!');
    },
    onError: (err: Error) => toast.error(`Erro ao salvar cobrança: ${err.message}`),
  });

  const avancarEtapaMutation = useMutation({
    mutationFn: ({ id, novaEtapa }: { id: string; novaEtapa: string }) =>
      cobrancaService.avancarEtapaCobranca(id, novaEtapa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      toast.success('Etapa de cobrança avançada!');
    },
    onError: (err: Error) => toast.error(`Erro ao avançar etapa: ${err.message}`),
  });

  return {
    cobrancas: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    saveCobranca: saveMutation.mutateAsync,
    avancarEtapa: avancarEtapaMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}

// ==============================================================================
// 4. COLABORADORES (RH)
// ==============================================================================
export function useColaboradoresQuery() {
  const queryClient = useQueryClient();

  const query = useQuery<ColaboradorDTO[]>({
    queryKey: ['colaboradores'],
    queryFn: () => colaboradorService.getColaboradores(),
    staleTime: STALE_5MIN,
  });

  const saveMutation = useMutation({
    mutationFn: (colaborador: ColaboradorDTO) => colaboradorService.saveColaborador(colaborador),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast.success('Colaborador salvo com sucesso!');
    },
    onError: (err: Error) => toast.error(`Erro ao salvar colaborador: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => colaboradorService.deleteColaborador(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast.success('Colaborador removido com sucesso!');
    },
    onError: (err: Error) => toast.error(`Erro ao remover colaborador: ${err.message}`),
  });

  return {
    colaboradores: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    saveColaborador: saveMutation.mutateAsync,
    deleteColaborador: deleteMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ==============================================================================
// 5. CONTAS A PAGAR
// ==============================================================================
export function useContasPagarQuery() {
  const queryClient = useQueryClient();

  const query = useQuery<ContaPagarDTO[]>({
    queryKey: ['contas_pagar'],
    queryFn: () => contaPagarService.getContasPagar(),
    staleTime: STALE_5MIN,
  });

  const saveMutation = useMutation({
    mutationFn: (conta: ContaPagarDTO) => contaPagarService.saveContaPagar(conta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas_pagar'] });
      toast.success('Conta a pagar salva com sucesso!');
    },
    onError: (err: Error) => toast.error(`Erro ao salvar conta: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contaPagarService.deleteContaPagar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas_pagar'] });
      toast.success('Conta a pagar removida com sucesso!');
    },
    onError: (err: Error) => toast.error(`Erro ao remover conta: ${err.message}`),
  });

  const pagarMutation = useMutation({
    mutationFn: ({ id, valor, data }: { id: string; valor?: number; data?: string }) =>
      contaPagarService.pagarConta(id, valor, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas_pagar'] });
      toast.success('Pagamento registrado com sucesso!');
    },
    onError: (err: Error) => toast.error(`Erro ao registrar pagamento: ${err.message}`),
  });

  return {
    contasPagar: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    saveContaPagar: saveMutation.mutateAsync,
    deleteContaPagar: deleteMutation.mutateAsync,
    pagarConta: pagarMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isPaying: pagarMutation.isPending,
  };
}

// ==============================================================================
// 6. CONTAS A RECEBER
// ==============================================================================
export function useContasReceberQuery() {
  const queryClient = useQueryClient();

  const query = useQuery<ContaReceberDTO[]>({
    queryKey: ['contas_receber'],
    queryFn: () => contaReceberService.getContasReceber(),
    staleTime: STALE_5MIN,
  });

  const saveMutation = useMutation({
    mutationFn: (conta: ContaReceberDTO) => contaReceberService.saveContaReceber(conta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas_receber'] });
      toast.success('Conta a receber salva com sucesso!');
    },
    onError: (err: Error) => toast.error(`Erro ao salvar conta: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contaReceberService.deleteContaReceber(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas_receber'] });
      toast.success('Conta a receber removida com sucesso!');
    },
    onError: (err: Error) => toast.error(`Erro ao remover conta: ${err.message}`),
  });

  const baixarMutation = useMutation({
    mutationFn: ({ id, valor, data }: { id: string; valor?: number; data?: string }) =>
      contaReceberService.baixarTitulo(id, valor, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas_receber'] });
      toast.success('Título baixado com sucesso!');
    },
    onError: (err: Error) => toast.error(`Erro ao baixar título: ${err.message}`),
  });

  return {
    contasReceber: query.data ?? [],
    titulos: query.data ?? [],
    recebimentos: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    saveContaReceber: saveMutation.mutateAsync,
    deleteContaReceber: deleteMutation.mutateAsync,
    baixarTitulo: baixarMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBaixando: baixarMutation.isPending,
  };
}

// ==============================================================================
// 7. FORNECEDORES
// ==============================================================================
export function useFornecedoresQuery() {
  const queryClient = useQueryClient();

  const query = useQuery<FornecedorDTO[]>({
    queryKey: ['fornecedores'],
    queryFn: () => fornecedorService.getFornecedores(),
    staleTime: STALE_5MIN,
  });

  const saveMutation = useMutation({
    mutationFn: (fornecedor: FornecedorDTO) => fornecedorService.saveFornecedor(fornecedor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor salvo com sucesso!');
    },
    onError: (err: Error) => toast.error(`Erro ao salvar fornecedor: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fornecedorService.deleteFornecedor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor removido com sucesso!');
    },
    onError: (err: Error) => toast.error(`Erro ao remover fornecedor: ${err.message}`),
  });

  return {
    fornecedores: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    saveFornecedor: saveMutation.mutateAsync,
    deleteFornecedor: deleteMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ==============================================================================
// 8. PROJETOS
// ==============================================================================
export function useProjetosQuery() {
  const queryClient = useQueryClient();

  const query = useQuery<ProjetoDTO[]>({
    queryKey: ['projetos'],
    queryFn: () => projetoService.getProjetos(),
    staleTime: STALE_5MIN,
  });

  const saveMutation = useMutation({
    mutationFn: (projeto: ProjetoDTO) => projetoService.saveProjeto(projeto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
      toast.success('Projeto salvo com sucesso!');
    },
    onError: (err: Error) => toast.error(`Erro ao salvar projeto: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projetoService.deleteProjeto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
      toast.success('Projeto removido com sucesso!');
    },
    onError: (err: Error) => toast.error(`Erro ao remover projeto: ${err.message}`),
  });

  const progressoMutation = useMutation({
    mutationFn: ({ id, progresso }: { id: string; progresso: number }) =>
      projetoService.updateProgresso(id, progresso),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
      toast.success('Progresso atualizado!');
    },
    onError: (err: Error) => toast.error(`Erro ao atualizar progresso: ${err.message}`),
  });

  return {
    projetos: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    saveProjeto: saveMutation.mutateAsync,
    deleteProjeto: deleteMutation.mutateAsync,
    updateProgresso: progressoMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ==============================================================================
// 9. USUÁRIOS
// ==============================================================================
export function useUsersQuery() {
  const queryClient = useQueryClient();

  const query = useQuery<UserDTO[]>({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
    staleTime: STALE_5MIN,
  });

  const currentUserQuery = useQuery({
    queryKey: ['current_user'],
    queryFn: () => userService.getCurrentUser(),
    staleTime: STALE_5MIN,
  });

  const saveMutation = useMutation({
    mutationFn: (user: UserDTO) => userService.saveUser(user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário salvo com sucesso!');
    },
    onError: (err: Error) => toast.error(`Erro ao salvar usuário: ${err.message}`),
  });

  return {
    users: query.data ?? [],
    currentUser: currentUserQuery.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    saveUser: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}

// ==============================================================================
// 10. AUDIT LOGS
// ==============================================================================
export function useAuditLogsQuery() {
  const queryClient = useQueryClient();

  const query = useQuery<AuditLogDTO[]>({
    queryKey: ['audit_logs'],
    queryFn: () => auditLogService.getAuditLogs(),
    staleTime: STALE_5MIN,
  });

  const logMutation = useMutation({
    mutationFn: (logData: Parameters<typeof auditLogService.logAction>[0]) =>
      auditLogService.logAction(logData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit_logs'] });
    },
  });

  return {
    auditLogs: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    logAction: logMutation.mutateAsync,
  };
}
