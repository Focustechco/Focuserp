import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colaboradorService } from '@/services/colaboradorService';
import { ColaboradorDTO } from '@/schemas/colaboradorSchema';
import { toast } from 'sonner';

export function useColaboradoresQuery() {
  const queryClient = useQueryClient();

  const {
    data: colaboradores = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ColaboradorDTO[]>({
    queryKey: ['colaboradores'],
    queryFn: () => colaboradorService.getColaboradores(),
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation({
    mutationFn: (colaborador: ColaboradorDTO) => colaboradorService.saveColaborador(colaborador),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast.success('Colaborador salvo com sucesso!');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar colaborador: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => colaboradorService.deleteColaborador(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast.success('Colaborador removido com sucesso!');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao remover colaborador: ${err.message}`);
    },
  });

  return {
    colaboradores,
    isLoading,
    isError,
    error,
    refetch,
    saveColaborador: saveMutation.mutateAsync,
    deleteColaborador: deleteMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
