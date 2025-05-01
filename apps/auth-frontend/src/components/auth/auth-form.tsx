import type { ReactNode } from 'react';

import { Link } from '@tanstack/react-router';
import {
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
} from 'lucide-react';
import React, { useId, useState } from 'react';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { BASE_API_URL } from '@/constants';
import { cn } from '@/lib/utils';

interface SocialAuthOption {
  provider: string;
  authUrl: string;
  icon: React.ReactNode;
}

const socialAuthOptions: SocialAuthOption[] = [
  {
    provider: 'Google',
    authUrl: `${BASE_API_URL}/api/v1/auth/google`,
    icon: Icons.google,
  },
  {
    provider: 'GitHub',
    authUrl: `${BASE_API_URL}/api/v1/auth/github`,
    icon: Icons.github,
  },
];

interface AuthFormProps {
  className?: string;
  title: string;
  description?: string;
  error?: string;
  isSubmitting?: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  submitText: string;
  loadingText?: string;
  footer?: ReactNode;
  mode: 'login' | 'register';
  children: ReactNode;
}

export function AuthForm({
  className,
  title,
  description,
  error,
  isSubmitting = false,
  onSubmit,
  submitText,
  loadingText,
  footer,
  mode,
  children,
  ...props
}: AuthFormProps) {
  return (
    <div
      className={cn('flex flex-col gap-6', className)}
      {...props}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <div className="flex flex-col gap-6">
              <SocialAuth options={socialAuthOptions} mode={mode} />

              <div className="grid grid-cols-3 items-center justify-between">
                <Separator />
                <p
                  className="bg-transparent text-muted-foreground text-xs w-full text-center"
                >
                  Or continue with
                </p>
                <Separator />
              </div>

              {/* Error message */}
              {error && (
                <div
                  role="alert"
                  className="flex items-center gap-2 p-4 text-sm border border-red-500 bg-red-50 text-red-900 rounded-md"
                >
                  <AlertCircleIcon className="h-4 w-4" aria-hidden="true" />
                  <div>{error}</div>
                </div>
              )}

              {children}

              <Button
                type="submit"
                className="w-full hover:cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? (
                      <>
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        {loadingText || submitText}
                      </>
                    )
                  : (
                      submitText
                    )}
              </Button>
            </div>
            {footer
              && (
                <div className="mt-4 text-center text-sm">
                  {footer}
                </div>
              )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SocialAuth(
  {
    options,
    mode,
  }: {
    options: SocialAuthOption[];
    mode: 'login' | 'register';
  },
) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {options.map((option) => (
        <a
          key={option.provider}
          href={option.authUrl}
          className="inline-flex"
        >
          <Button
            type="button"
            variant="outline"
            className="w-full h-9 px-3 flex justify-center items-center hover:cursor-pointer"
            aria-label={
              `${mode === 'login'
                ? 'Sign in'
                : 'Sign up'} with ${option.provider}`
            }
          >
            {/* Wrap the icon in a span with aria-hidden instead of cloning */}
            {option.icon && (
              <span aria-hidden="true">{option.icon}</span>
            )}
          </Button>
        </a>
      ))}
    </div>
  );
}

interface PasswordInputProps {
  'id': string;
  'label': string;
  'register': any;
  'error'?: string;
  'aria-describedby'?: string;
}

export function PasswordInput({
  id,
  label,
  register,
  error,
  'aria-describedby': customAriaDescribedby,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const errorId = useId();
  const describedBy = error
    ? `${errorId} ${customAriaDescribedby || ''}`.trim()
    : customAriaDescribedby;

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Input
          {...register}
          id={id}
          type={showPassword ? 'text' : 'password'}
          aria-invalid={!!error}
          aria-describedby={describedBy}
        />
        <Button
          type="button"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent bg-transparent hover:cursor-pointer text-muted-foreground"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-controls={id}
        >
          {showPassword
            ? (
                <EyeOffIcon className="h-4 w-4" aria-hidden="true" />
              )
            : (
                <EyeIcon className="h-4 w-4" aria-hidden="true" />
              )}
        </Button>
      </div>
      {error && (
        <p id={errorId} className="text-red-500 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthLink(
  {
    text,
    to,
    linkText,
  }: {
    text: string;
    to: string;
    linkText: string;
  },
) {
  return (
    <>
      {text}
      {' '}
      <Link
        to={to}
        className="underline underline-offset-4 hover:text-primary"
      >
        {linkText}
      </Link>
    </>
  );
}
