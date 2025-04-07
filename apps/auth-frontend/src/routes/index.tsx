import { createFileRoute, Outlet } from '@tanstack/react-router';

import { AuthGuard } from '@/components/auth/auth-guard';
import { AppLayout } from '@/components/layout/app-layout';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  return (
    <AuthGuard requireAuth={true}>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </AuthGuard>
  );
}
