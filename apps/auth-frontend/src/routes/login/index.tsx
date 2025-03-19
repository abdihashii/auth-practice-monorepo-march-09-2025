// Third-party imports
import { createFileRoute } from "@tanstack/react-router";

// Local components
import { AuthGuard } from "@/components/auth/AuthGuard";
import { LoginForm } from "@/components/auth/LoginForm";

export const Route = createFileRoute("/login/")({
  component: Login,
});

function Login() {
  return (
    <AuthGuard requireAuth={false}>
      <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </main>
    </AuthGuard>
  );
}
