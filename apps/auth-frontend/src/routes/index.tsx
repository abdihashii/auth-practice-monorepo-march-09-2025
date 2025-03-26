import { createFileRoute } from '@tanstack/react-router';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/hooks/use-auth-context';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  const { user, logout } = useAuthContext();

  return (
    <AuthGuard requireAuth={true}>
      <main className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-4xl">
          <h1 className="mb-6 text-center text-3xl font-bold">Dashboard</h1>

          <div className="mb-6 rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Welcome,
              {' '}
              {user?.name ?? 'User'}
              !
            </h2>
            <p className="mb-4 text-muted-foreground">
              You are now authenticated and viewing a protected route.
            </p>

            <p className="text-muted-foreground">
              <span className="font-bold">Email:</span>
              {' '}
              {user?.email}
            </p>

            <pre>
              <code>{JSON.stringify(user, null, 2)}</code>
            </pre>
          </div>

          <div className="w-full flex justify-center">
            <Button onClick={() => logout()}>Logout</Button>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
