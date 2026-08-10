import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projetoService } from '@/services/projetoService';
import { ProjetoDTO } from '@/schemas/projetoSchema';
import { toast } from 'sonner';

export function useProjetosQuery() {
  const queryClient = useQueryClient();

  const {
    data: projetos = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ProjetoDTO[]>({
    queryKey: ['projetos'],
    queryFn: () => projetoService.getProjetos(),
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation({
    mutationFn: (projeto: ProjetoDTO) => projetoService.saveProjeto(projeto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
      toast.success('Projeto salvo com sucesso!');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar projeto: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projetoService.deleteProjeto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
      toast.success('Projeto removido com sucesso!');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao remover projeto: ${err.message}`);
    },
  });

  return {
    projetos,
    isLoading,
    isError,
    error,
    refetch,
    saveProjeto: saveMutation.mutateAsync,
    deleteProjeto: deleteMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
