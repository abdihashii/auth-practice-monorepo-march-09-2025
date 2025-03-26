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
  TOKEN_INVALIDATED = 'TOKEN_INVALIDATED', // Token invalidated, 401
}

export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}
