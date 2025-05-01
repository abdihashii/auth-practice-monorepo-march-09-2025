import { createFileRoute } from '@tanstack/react-router';

import ChangePasswordCard from '@/components/account/change-password-card';
import { AuthGuard } from '@/components/auth/auth-guard';
import { AppLayout } from '@/components/layout/app-layout';

export const Route = createFileRoute('/account/security/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AuthGuard requireAuth={true}>
      <AppLayout>
        <ChangePasswordCard />
      </AppLayout>
    </AuthGuard>
  );
}
