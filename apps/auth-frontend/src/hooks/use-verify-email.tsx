import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import { resendVerificationEmail, verifyEmail } from '@/api/auth-apis';

type VerificationState = 'idle' | 'loading' | 'success' | 'error' | 'no-token';
type ErrorType = 'token-expired' | 'invalid-token' | 'unknown';
type ResendState = 'idle' | 'submitting' | 'success' | 'error';

export function useVerifyEmail(token?: string) {
  // States for the verify email form
  const [verificationState, setVerificationState] = useState<VerificationState>('idle');
  const [verificationErrorType, setVerificationErrorType] = useState<ErrorType>('unknown');
  const [verificationErrorMessage, setVerificationErrorMessage] = useState<string>('');

  // States for the resend email form
  const [email, setEmail] = useState('');
  const [resendState, setResendState] = useState<ResendState>('idle');
  const [resendError, setResendError] = useState('');
  const [resendMessage, setResendMessage] = useState('');

  const navigate = useNavigate();

  /**
   * Verify the user's email
   *
   * @param signal - The signal to abort the request
   * @returns The result of the verification
   */
  const verifyUserEmail = useCallback(async (signal?: AbortSignal) => {
    if (!token) {
      setVerificationState('no-token');
      setVerificationErrorMessage('No verification token was provided. Please use the link from your verification email or request a new one.');
      return;
    }

    setVerificationState('loading');

    const result = await verifyEmail(token, signal);

    if (!result.success) {
      setVerificationState('error');

      if (result.error?.code === 'EMAIL_VERIFICATION_TOKEN_EXPIRED') {
        setVerificationErrorType('token-expired');
      } else if (result.error?.code === 'INVALID_EMAIL_VERIFICATION_TOKEN') {
        setVerificationErrorType('invalid-token');
      } else {
        setVerificationErrorType('unknown');
      }

      setVerificationErrorMessage(result.error?.message || 'Failed to verify email');
      return;
    }

    setVerificationState('success');
  }, [token]);

  /**
   * Effect to verify the user's email immediately after the component mounts
   */
  useEffect(() => {
    const abortController = new AbortController();
    verifyUserEmail(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [verifyUserEmail]);

  /**
   * Click handler to navigate to the login page
   */
  const handleNavigateToLogin = () => {
    navigate({ to: '/login' });
  };

  /**
   * Click handler to resend the verification email
   */
  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setResendError('Please enter your email address');
      return;
    }

    setResendState('submitting');
    setResendError('');
    setResendMessage('');

    const result = await resendVerificationEmail(email);

    if (result.success) {
      setResendState('success');
      setResendMessage(result.message || 'Verification email sent successfully');
    } else {
      setResendState('error');
      setResendError(result.error?.message || 'Failed to resend verification email');
    }
  };

  return {
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
  };
}
