/**
 * Array of valid authentication provider types
 * Used to validate auth providers across the application
 */
export const VALID_AUTH_PROVIDERS = ['email', 'google', 'github'] as const;

/**
 * The default authentication provider
 */
export const DEFAULT_AUTH_PROVIDER = 'email' as const;
