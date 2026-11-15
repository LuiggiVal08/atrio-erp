import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        return failureCount < 1 && (status === undefined || status >= 500);
      },
      retryDelay: 1000,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});
