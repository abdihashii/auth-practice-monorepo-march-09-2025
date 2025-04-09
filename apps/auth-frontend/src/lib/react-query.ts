import { QueryClient } from '@tanstack/react-query';

// Create a client for use outside of React components
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});
