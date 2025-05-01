import { createFileRoute } from '@tanstack/react-router';

import { AuthGuard } from '@/components/auth/auth-guard';

export const Route = createFileRoute('/forgot-password/')({
  component: ForgotPassword,
});

function ForgotPassword() {
  return (
    <AuthGuard requireAuth={false}>
      <div className="p-4">
        <h1>Forgot Password</h1>
        <p>Password recovery form will go here.</p>
        {/* TODO: Implement forgot password form */}
      </div>
    </AuthGuard>
  );
}
