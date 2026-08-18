import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeiroService } from '@/services/financeiroService';
import { TituloReceberDTO } from '@/schemas/financeiroSchema';
import { toast } from 'sonner';

export function useContasReceberQuery() {
  const queryClient = useQueryClient();

  const {
    data: titulos = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<TituloReceberDTO[]>({
    queryKey: ['contas_receber'],
    queryFn: () => financeiroService.getContasReceber(),
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation({
    mutationFn: (titulo: TituloReceberDTO) => financeiroService.saveContaReceber(titulo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas_receber'] });
      toast.success('Título a receber salvo com sucesso!');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar título: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeiroService.deleteContaReceber(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas_receber'] });
      toast.success('Título a receber removido com sucesso!');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao remover título: ${err.message}`);
    },
  });

  return {
    titulos,
    recebimentos: titulos,
    contasReceber: titulos,
    isLoading,
    isError,
    error,
    refetch,
    saveTitulo: saveMutation.mutateAsync,
    deleteTitulo: deleteMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
