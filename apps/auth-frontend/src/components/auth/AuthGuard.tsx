// React
import { Navigate, useLocation } from "@tanstack/react-router";

// Third-party components
import { Loader2Icon } from "lucide-react";

// Local components
import { useAuthContext } from "@/providers/auth-context-provider";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * AuthGuard component that controls access to routes based on authentication state
 *
 * If the route is protected and the user is not authenticated, they will be redirected to the login page.
 * If the route is public, all users will be able to access it.
 * If the route is protected and the user is authenticated, they will be able to access the route.
 *
 * @param children The content to render if authentication check passes
 * @param requireAuth Whether authentication is required (default: true)
 */
export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const location = useLocation();
  const { isAuthenticated, isPending } = useAuthContext();

  // Show loading spinner during authentication check
  if (isPending) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <Loader2Icon className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // For protected routes: redirect to login if not authenticated
  if (requireAuth && !isAuthenticated) {
    // Store the current location to redirect back after login
    const currentPath = location.pathname;
    return (
      <Navigate
        to="/login"
        // Pass original destination as state so we can redirect after login
        search={
          currentPath !== "/login" ? { redirect: currentPath } : undefined
        }
        replace
      />
    );
  }

  // For public routes that require guest access (like login): redirect to home if authenticated
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Authentication check passed, render children
  return <>{children}</>;
}
