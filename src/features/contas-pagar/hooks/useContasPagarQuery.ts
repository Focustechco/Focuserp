import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeiroService } from '@/services/financeiroService';
import { ContaPagarDTO } from '@/schemas/financeiroSchema';
import { toast } from 'sonner';

export function useContasPagarQuery() {
  const queryClient = useQueryClient();

  const {
    data: contas = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ContaPagarDTO[]>({
    queryKey: ['contas_pagar'],
    queryFn: () => financeiroService.getContasPagar(),
    staleTime: 0,
  });

  const saveMutation = useMutation({
    mutationFn: (conta: ContaPagarDTO) => financeiroService.saveContaPagar(conta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas_pagar'] });
      toast.success('Conta a pagar salva com sucesso!');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar conta: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeiroService.deleteContaPagar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas_pagar'] });
      toast.success('Conta a pagar removida com sucesso!');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao remover conta: ${err.message}`);
    },
  });

  return {
    contas,
    isLoading,
    isError,
    error,
    refetch,
    saveConta: saveMutation.mutateAsync,
    deleteConta: deleteMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
