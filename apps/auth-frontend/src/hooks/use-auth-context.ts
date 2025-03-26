import { use } from 'react';

import { AuthContext } from '@/contexts/auth-context';

/**
 * Hook for components to get the auth object and re-render when it changes.
 */
export function useAuthContext() {
  const context = use(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}
