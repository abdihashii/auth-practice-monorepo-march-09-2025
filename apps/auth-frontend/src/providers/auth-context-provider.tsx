// React
import { createContext, useContext } from "react";

// Third-party components
import { useQuery } from "@tanstack/react-query";

// Local components
import { AUTH_QUERY_KEY, useAuth } from "@/hooks/use-auth";

type User = {
  id: string;
  email: string;
  name?: string;
};

type AuthContextType = {
  user: User | null;
  isPending: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { loginMutation } = useAuth();

  // Get user data from the query cache
  const { data: user, isPending } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    // No queryFn needed as data comes from the login mutation
    staleTime: Infinity,
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  // Context value object
  const value: AuthContextType = {
    user: user as User | null,
    isPending: isPending || loginMutation.isPending,
    isAuthenticated: !!user,
    login,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
};
