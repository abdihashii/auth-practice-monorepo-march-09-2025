// Prefixes for the cookies that store the authentication tokens
export const AUTH_TOKEN_COOKIE_PREFIX_PROD = '__ryoa-auth-app-';
export const AUTH_TOKEN_COOKIE_PREFIX_DEV = 'auth-app-';

// Prod and dev cookie names for the access token
export const ACCESS_TOKEN_COOKIE_NAME_PROD = `${AUTH_TOKEN_COOKIE_PREFIX_PROD}accessToken`;
export const ACCESS_TOKEN_COOKIE_NAME_DEV = `${AUTH_TOKEN_COOKIE_PREFIX_DEV}accessToken`;

// Prod and dev cookie names for the refresh token
export const REFRESH_TOKEN_COOKIE_NAME_PROD = `${AUTH_TOKEN_COOKIE_PREFIX_PROD}refreshToken`;
export const REFRESH_TOKEN_COOKIE_NAME_DEV = `${AUTH_TOKEN_COOKIE_PREFIX_DEV}refreshToken`;

// Name for the OAuth state cookie
export const OAUTH_STATE_COOKIE_NAME = 'ryoa-oauth-state';
