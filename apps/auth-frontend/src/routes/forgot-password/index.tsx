import { createFileRoute, useSearch } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';

import { AuthForm } from '@/components/auth/auth-form';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const forgotPasswordTokenSchema = z.object({
  token: z.string().min(1).optional(),
});

export const Route = createFileRoute('/forgot-password/')({
  component: ForgotPassword,
  validateSearch: zodValidator(forgotPasswordTokenSchema),
});

function ForgotPassword() {
  const { token } = useSearch({ from: '/forgot-password/' });

  return (
    <AuthGuard requireAuth={false}>
      <main
        className="flex min-h-svh w-full items-center justify-center p-6 md:p-10"
      >
        <div className="w-full max-w-md">
          <AuthForm
            title="Forgot Password"
            description="Enter your email below to reset your password"
            mode="forgot-password"
            onSubmit={() => {}}
            submitText="Reset Password"
            loadingText="Resetting password..."
          >
            {!token
              ? (
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="test@example.com" />
                  </div>
                )
              : (
                  <div className="grid gap-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input id="password" type="password" placeholder="********" />
                  </div>
                )}
          </AuthForm>
        </div>
      </main>
    </AuthGuard>
  );
}
