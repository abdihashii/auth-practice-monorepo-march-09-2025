import { createFileRoute, Outlet } from '@tanstack/react-router';

import { AuthGuard } from '@/components/auth/auth-guard';
import { AppLayout } from '@/components/layout/app-layout';

export const Route = createFileRoute('/account/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AuthGuard requireAuth={true}>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </AuthGuard>
  );
}
