import { createFileRoute } from '@tanstack/react-router';

import { AuthForm } from '@/components/auth/auth-form';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/forgot-password/')({
  component: ForgotPassword,
});

function ForgotPassword() {
  return (
    <AuthGuard requireAuth={false}>
      <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <AuthForm
            title="Forgot Password"
            description="Enter your email below to reset your password"
            mode="forgot-password"
            onSubmit={() => {}}
            submitText="Reset Password"
            loadingText="Resetting password..."
          >
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="test@example.com" />
            </div>
          </AuthForm>
        </div>
      </main>
    </AuthGuard>
  );
}
