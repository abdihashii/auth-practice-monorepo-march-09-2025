import { createFileRoute } from '@tanstack/react-router';

import ChangePasswordCard from '@/components/account/change-password-card';
import PasskeysCard from '@/components/account/passkeys-card';
import { AuthGuard } from '@/components/auth/auth-guard';
import { AppLayout } from '@/components/layout/app-layout';

export const Route = createFileRoute('/account/security/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AuthGuard requireAuth={true}>
      <AppLayout>
        <div className="flex flex-col gap-4">
          <ChangePasswordCard />
          <PasskeysCard />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
