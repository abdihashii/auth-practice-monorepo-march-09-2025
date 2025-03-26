import { AuthContext } from '@/contexts/auth-context';
import { useAuth } from '@/hooks/use-auth';

/**
 * Provider component that wraps your app and makes auth object available to any
 * child component that calls useAuthContext().
 */
export function AuthContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use our custom hook to get auth methods and state
  const auth = useAuth();

  return <AuthContext value={auth}>{children}</AuthContext>;
}
