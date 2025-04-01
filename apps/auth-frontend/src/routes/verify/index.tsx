import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';

import { VerifyEmail } from '@/components/auth/verify-email';

const verifyTokenSchema = z.object({
  token: z.string().min(1),
});

export const Route = createFileRoute('/verify/')({
  component: RouteComponent,
  validateSearch: zodValidator(verifyTokenSchema),
});

function RouteComponent() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <VerifyEmail />
      </div>
    </main>
  );
}
