import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clienteService } from '@/services/clienteService';
import { ClienteDTO } from '@/schemas/clienteSchema';
import { toast } from 'sonner';

/**
 * Hook customizado com React Query para consumo reativo e performático dos Clientes.
 */
export function useClientesQuery() {
  const queryClient = useQueryClient();

  // Query para buscar lista de clientes com cache reativo
  const {
    data: clientes = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ClienteDTO[]>({
    queryKey: ['clientes'],
    queryFn: () => clienteService.getClientes(),
    staleTime: 0,
  });

  // Mutação para salvar/atualizar cliente
  const saveMutation = useMutation({
    mutationFn: (cliente: ClienteDTO) => clienteService.saveCliente(cliente),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['recorrencias'] });
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      toast.success('Cliente salvo com sucesso!');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar cliente: ${err.message}`);
    },
  });

  // Mutação para excluir cliente
  const deleteMutation = useMutation({
    mutationFn: (id: string) => clienteService.deleteCliente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['recorrencias'] });
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      queryClient.invalidateQueries({ queryKey: ['titulos'] });
      toast.success('Cliente e suas recorrências foram removidos com sucesso!');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao remover cliente: ${err.message}`);
    },
  });

  return {
    clientes,
    isLoading,
    isError,
    error,
    refetch,
    saveCliente: saveMutation.mutateAsync,
    deleteCliente: deleteMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
