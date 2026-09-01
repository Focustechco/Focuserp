import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clienteService } from '@/services/clienteService';
import { ClienteDTO } from '@/schemas/clienteSchema';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

/**
 * Hook customizado com React Query para consumo reativo e performático dos Clientes.
 * Sincronizado em tempo real entre Mobile (iOS/Android) e Desktop via Supabase Realtime.
 */
export function useClientesQuery() {
  const queryClient = useQueryClient();

  // Query para buscar lista de clientes com cache reativo e polling fallback
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
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5000, // Sincronização periódica em background a cada 5s
  });

  // Inscrição Realtime no Supabase para sincronização instantânea Desktop <-> Mobile
  useEffect(() => {
    const channelName = `rt_clientes_sync_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clientes' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['clientes'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['clientes'] });
        }
      )
      .subscribe();

    const handleSync = () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleSync);
      window.addEventListener('storage', handleSync);
      window.addEventListener('focus_storage_update', handleSync);
      window.addEventListener('focus_clients_updated', handleSync);
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') handleSync();
        });
      }
    }

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleSync);
        window.removeEventListener('storage', handleSync);
        window.removeEventListener('focus_storage_update', handleSync);
        window.removeEventListener('focus_clients_updated', handleSync);
      }
    };
  }, [queryClient]);

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
      toast.success('Cliente e seus registros vinculados foram removidos com sucesso!');
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
