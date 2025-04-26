import type { ProviderUserProfile } from '@/lib/types';

export interface IOAuthProvider {
  providerName: 'google' | 'github' | 'apple'; // Add other providers as needed
  getAuthorizationUrl: (state: string, scopes?: string[]) => string;
  handleCallback: (code: string, state: string, storedState: string) => Promise<ProviderUserProfile>;
  // Optional: Add methods like refreshToken, revokeToken if needed later
}
