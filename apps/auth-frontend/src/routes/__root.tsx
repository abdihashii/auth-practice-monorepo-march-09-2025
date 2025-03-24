import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Loader2Icon } from 'lucide-react';
import { Suspense } from 'react';

import { AuthContextProvider } from '@/providers/auth-context-provider';
import { ThemeProvider } from '@/providers/theme-provider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // Increase stale time to reduce unnecessary refetches
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center">
      <Loader2Icon className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        {/* Use Suspense to handle async data loading */}
        <Suspense fallback={<LoadingFallback />}>
          <AuthContextProvider>
            <Outlet />
          </AuthContextProvider>
        </Suspense>
        <TanStackRouterDevtools />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  ),
});
