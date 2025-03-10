export enum ApiErrorCode {
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR", // Something went wrong on the server
  NOT_FOUND = "NOT_FOUND", // The requested resource was not found
  VALIDATION_ERROR = "VALIDATION_ERROR", // Input validation failed
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
