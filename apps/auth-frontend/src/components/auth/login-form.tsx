import type { z } from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';
import { loginFormSchema } from '@roll-your-own-auth/shared/schemas';
import { useForm } from 'react-hook-form';

import {
  AuthForm,
  AuthLink,
  PasswordInput,
} from '@/components/auth/auth-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/hooks/use-auth-context';

interface LoginFormProps {
  className?: string;
}

export function LoginForm({
  className,
}: LoginFormProps) {
  const { login, isLoggingIn } = useAuthContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: z.infer<typeof loginFormSchema>) {
    try {
      await login(data.email, data.password);
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: error instanceof Error
          ? error.message
          : 'Failed to log in. Please try again.',
      });
    }
  }

  return (
    <AuthForm
      className={className}
      title="Login"
      description="Enter your email below to login to your account"
      error={errors.root?.message}
      isSubmitting={isLoggingIn}
      onSubmit={handleSubmit(onSubmit)}
      submitText="Login"
      loadingText="Logging in..."
      footer={(
        <AuthLink
          text="Don't have an account?"
          to="/register"
          linkText="Register"
        />
      )}
      mode="login"
    >
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          {...register('email')}
          id="email"
          type="email"
          placeholder="test@example.com"
        />
        {errors.email && (
          <p className="text-red-500">{errors.email.message}</p>
        )}
      </div>

      <PasswordInput
        id="password"
        label="Password"
        register={register('password')}
        error={errors.password?.message}
      />
    </AuthForm>
  );
}
