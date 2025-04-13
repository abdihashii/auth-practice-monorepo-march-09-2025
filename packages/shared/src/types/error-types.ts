export enum ApiErrorCode {
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR', // Something went wrong on the server, 500
  NOT_FOUND = 'NOT_FOUND', // The requested resource was not found, 404
  VALIDATION_ERROR = 'VALIDATION_ERROR', // Input validation failed, 400
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS', // User already exists, 400
  USER_NOT_FOUND = 'USER_NOT_FOUND', // User not found, 404
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS', // Invalid credentials, 401
  NO_REFRESH_TOKEN = 'NO_REFRESH_TOKEN', // No refresh token provided, 401
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN', // Invalid refresh token, 401
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED', // Refresh token expired, 401
  USER_INACTIVE = 'USER_INACTIVE', // User is inactive, 401
  UNAUTHORIZED = 'UNAUTHORIZED', // Unauthorized, 401
  INVALID_ACCESS_TOKEN = 'INVALID_ACCESS_TOKEN', // Invalid access token, 401
  ACCESS_TOKEN_EXPIRED = 'ACCESS_TOKEN_EXPIRED', // Access token expired, 401
  ACCESS_TOKEN_INVALIDATED = 'ACCESS_TOKEN_INVALIDATED', // Access token invalidated, 401
  REFRESH_TOKEN_INVALIDATED = 'REFRESH_TOKEN_INVALIDATED', // Refresh token invalidated, 401
  INVALID_EMAIL_VERIFICATION_TOKEN = 'INVALID_EMAIL_VERIFICATION_TOKEN', // Invalid email verification token, 401
  EMAIL_VERIFICATION_TOKEN_EXPIRED = 'EMAIL_VERIFICATION_TOKEN_EXPIRED', // Email verification token expired, 401
  EMAIL_VERIFICATION_FAILED = 'EMAIL_VERIFICATION_FAILED', // Failed to send verification email, 400
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED', // User email not verified, 403
}

export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export const authErrorCodesRequiringLogout = [
  ApiErrorCode.NO_REFRESH_TOKEN, // Refresh token is missing completely
  ApiErrorCode.INVALID_REFRESH_TOKEN, // Refresh token is invalid/tampered with
  ApiErrorCode.REFRESH_TOKEN_EXPIRED, // Refresh token has expired
  ApiErrorCode.ACCESS_TOKEN_INVALIDATED, // Tokens were explicitly invalidated (e.g. after password change)
  ApiErrorCode.USER_INACTIVE, // User account has been deactivated
  ApiErrorCode.USER_NOT_FOUND, // User account does not exist
];
