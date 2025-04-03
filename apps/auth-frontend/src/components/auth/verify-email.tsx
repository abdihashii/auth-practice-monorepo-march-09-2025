import { useSearch } from '@tanstack/react-router';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useVerifyEmail } from '@/hooks/use-verify-email';

export function VerifyEmail() {
  const search = useSearch({ from: '/verify/' });
  const token = search.token;

  const {
    // States
    email,
    verificationState,
    verificationErrorType,
    verificationErrorMessage,
    resendState,
    resendError,
    resendMessage,

    // Handlers
    handleNavigateToLogin,
    handleResendVerification,

    // State setters
    setEmail,
  } = useVerifyEmail(token);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>
            {verificationState === 'idle' || verificationState === 'loading'
              ? 'Verifying your email address...'
              : verificationState === 'success'
                ? 'Your email has been verified'
                : 'Email verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verificationState === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-center text-muted-foreground">Verifying your email address...</p>
            </div>
          )}

          {verificationState === 'success' && (
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

          {verificationState === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>Verification failed</AlertTitle>
                <AlertDescription>
                  {verificationErrorMessage}
                </AlertDescription>
              </Alert>

              {verificationErrorType === 'token-expired' && (
                <div className="w-full mt-6 p-4 border rounded-md">
                  <h3 className="text-lg font-medium mb-2">Request a new verification link</h3>
                  <form onSubmit={handleResendVerification}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={resendState === 'submitting' || resendState === 'success'}
                          required
                        />
                      </div>

                      {resendError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{resendError}</AlertDescription>
                        </Alert>
                      )}

                      {resendMessage && (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-700">{resendMessage}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={resendState === 'submitting' || resendState === 'success'}
                      >
                        {resendState === 'submitting'
                          ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Sending...
                              </>
                            )
                          : resendState === 'success'
                            ? (
                                'Email Sent'
                              )
                            : (
                                'Send Verification Link'
                              )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              <Button className="w-full mt-2" onClick={handleNavigateToLogin}>
                Return to Login
              </Button>
            </div>
          )}

          {verificationState === 'no-token' && (
            <div className="flex flex-col items-center space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>Missing verification token</AlertTitle>
                <AlertDescription>
                  {verificationErrorMessage}
                </AlertDescription>
              </Alert>

              <div className="w-full mt-6 p-4 border rounded-md">
                <h3 className="text-lg font-medium mb-2">Request a new verification link</h3>
                <form onSubmit={handleResendVerification}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-resend">Email</Label>
                      <Input
                        id="email-resend"
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={resendState === 'submitting' || resendState === 'success'}
                        required
                      />
                    </div>

                    {resendError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{resendError}</AlertDescription>
                      </Alert>
                    )}

                    {resendMessage && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">{resendMessage}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={resendState === 'submitting' || resendState === 'success'}
                    >
                      {resendState === 'submitting'
                        ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Sending...
                            </>
                          )
                        : resendState === 'success'
                          ? (
                              'Email Sent'
                            )
                          : (
                              'Send Verification Link'
                            )}
                    </Button>
                  </div>
                </form>
              </div>

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
