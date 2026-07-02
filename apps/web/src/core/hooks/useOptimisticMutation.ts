import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { toastService } from '@/core/services/toast-service';

interface OptimisticMutationConfig<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: QueryKey;
  onOptimisticUpdate: (variables: TVariables) => void;
  rollback: () => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useOptimisticMutation<TData, TVariables>(
  config: OptimisticMutationConfig<TData, TVariables>,
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables, { previousData: unknown }>({
    mutationFn: config.mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: config.queryKey });
      const previousData = queryClient.getQueryData(config.queryKey);
      config.onOptimisticUpdate(variables);
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(config.queryKey, context.previousData);
        config.rollback();
      }
      toastService.error(config.errorMessage ?? 'Error', _err.message);
    },
    onSuccess: () => {
      toastService.success(config.successMessage ?? 'Operación exitosa');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: config.queryKey });
    },
  });
}
