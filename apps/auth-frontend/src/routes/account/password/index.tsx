import { createFileRoute } from '@tanstack/react-router';

import { AuthGuard } from '@/components/auth/auth-guard';
import { AppLayout } from '@/components/layout/app-layout';

export const Route = createFileRoute('/account/password/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AuthGuard requireAuth={true}>
      <AppLayout>
        <div>Hello "/account/password/"!</div>
      </AppLayout>
    </AuthGuard>
  );
}
