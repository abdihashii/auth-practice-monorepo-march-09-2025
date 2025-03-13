export enum ApiErrorCode {
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR", // Something went wrong on the server, 500
  NOT_FOUND = "NOT_FOUND", // The requested resource was not found, 404
  VALIDATION_ERROR = "VALIDATION_ERROR", // Input validation failed, 400
  USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS", // User already exists, 400
  USER_NOT_FOUND = "USER_NOT_FOUND", // User not found, 404
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS", // Invalid credentials, 401
}

export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}
