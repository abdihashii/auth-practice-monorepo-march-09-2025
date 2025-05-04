import { createFileRoute } from '@tanstack/react-router';

import { AccountPreferencesCard } from '@/components/account/account-preferences-card';
import { NotificationPreferencesCard } from '@/components/account/notification-preferences-card';
import { AuthGuard } from '@/components/auth/auth-guard';
import { AppLayout } from '@/components/layout/app-layout';

export const Route = createFileRoute('/account/preferences/')({
  component: Preferences,
});

function Preferences() {
  return (
    <AuthGuard requireAuth={true}>
      <AppLayout>
        <div className="flex flex-col gap-4">
          <AccountPreferencesCard />
          <NotificationPreferencesCard />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
