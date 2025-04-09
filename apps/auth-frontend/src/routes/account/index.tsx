import { createFileRoute } from '@tanstack/react-router';

import { ProfileCard } from '@/components/account/profile-card';
import { AuthGuard } from '@/components/auth/auth-guard';
import { AppLayout } from '@/components/layout/app-layout';

export const Route = createFileRoute('/account/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AuthGuard requireAuth={true}>
      <AppLayout>
        <ProfileCard />
      </AppLayout>
    </AuthGuard>
  );
}
