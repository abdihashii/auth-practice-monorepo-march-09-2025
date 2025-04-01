import { useNavigate, useSearch } from '@tanstack/react-router';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { verifyEmail } from '@/api/auth-apis';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type VerificationState = 'idle' | 'loading' | 'success' | 'error' | 'no-token';
type ErrorType = 'token-expired' | 'invalid-token' | 'unknown';

export function VerifyEmail() {
  const search = useSearch({ from: '/verify/' });
  const token = search.token;
  const navigate = useNavigate();

  const [state, setState] = useState<VerificationState>('idle');
  const [_, setErrorType] = useState<ErrorType>('unknown');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const verifyUserEmail = useCallback(async (signal?: AbortSignal) => {
    if (!token) {
      setState('no-token');
      return;
    }

    setState('loading');

    const result = await verifyEmail(token, signal);

    if (!result.success) {
      setState('error');

      if (result.error?.code === 'EMAIL_VERIFICATION_TOKEN_EXPIRED') {
        setErrorType('token-expired');
      } else if (result.error?.code === 'INVALID_EMAIL_VERIFICATION_TOKEN') {
        setErrorType('invalid-token');
      } else {
        setErrorType('unknown');
      }

      setErrorMessage(result.error?.message || 'Failed to verify email');
      return;
    }

    setState('success');
  }, [token]);

  useEffect(() => {
    const abortController = new AbortController();
    verifyUserEmail(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [verifyUserEmail]);

  const handleNavigateToLogin = () => {
    navigate({ to: '/login' });
  };

  // const handleResendVerification = () => {
  //   navigate({ to: '/resend-verification' });
  // };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>
            {state === 'idle' || state === 'loading'
              ? 'Verifying your email address...'
              : state === 'success'
                ? 'Your email has been verified'
                : 'Email verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-center text-muted-foreground">Verifying your email address...</p>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-800">Email verified successfully</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your email has been verified. You can now log in to your account.
                </AlertDescription>
              </Alert>
              <Button className="w-full mt-4" onClick={handleNavigateToLogin}>
                Proceed to Login
              </Button>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>Verification failed</AlertTitle>
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
              </Alert>

              {/* {errorType === 'token-expired' && (
                <Button variant="outline" className="w-full mt-2" onClick={handleResendVerification}>
                  Request new verification link
                </Button>
              )} */}

              <Button className="w-full mt-2" onClick={handleNavigateToLogin}>
                Return to Login
              </Button>
            </div>
          )}

          {state === 'no-token' && (
            <div className="flex flex-col items-center space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>Missing verification token</AlertTitle>
                <AlertDescription>
                  No verification token was provided. Please use the link from your verification email.
                </AlertDescription>
              </Alert>
              {/* <Button variant="outline" className="w-full mt-2" onClick={handleResendVerification}>
                Request new verification link
              </Button> */}
              <Button className="w-full mt-2" onClick={handleNavigateToLogin}>
                Return to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
