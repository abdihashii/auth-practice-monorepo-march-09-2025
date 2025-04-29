import { createFileRoute } from '@tanstack/react-router';

import DeleteAccountCard from '@/components/account/delete-account-card';
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
        <div className="flex flex-col gap-4">
          <ProfileCard />
          <DeleteAccountCard />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
