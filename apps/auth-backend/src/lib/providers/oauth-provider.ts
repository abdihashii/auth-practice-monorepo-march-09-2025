import type { OAuthProvider } from '@roll-your-own-auth/shared/types';

import type { ProviderUserProfile } from '@/lib/types';

export interface IOAuthProvider {
  providerName: OAuthProvider;
  getAuthorizationUrl: (state: string, scopes?: string[]) => string;
  handleCallback: (
    code: string,
    state: string,
    storedState: string,
  ) => Promise<ProviderUserProfile>;
  // Optional: Add methods like refreshToken, revokeToken if needed later
}
