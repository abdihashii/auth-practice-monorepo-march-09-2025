# Token Usage in API Responses

This document outlines how authentication tokens are used in the API responses of the auth-backend service.

## Authentication Flow

The authentication system uses a dual-token approach:

1. **Access Token**: Short-lived JWT used for API authorization
2. **Refresh Token**: Long-lived token used to obtain new access tokens

## Token Format

All tokens are JSON Web Tokens (JWT) with the following structure:

```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5M2FkM2YyOS05Yjc3LTQ0MDAtODA0ZS1jMmI0ZGQ5N2RlZjciLCJleHAiOjE2NDEyMzQzODgsImlhdCI6MTY0MTIzMzc4OH0.WMS6Eur3HyFPDkdvGzlznaXd5FFA6z7TBBF9qbAStdI
```

## Access Token

Access tokens are returned in the API response body after successful authentication operations:

### Response Format

```json
{
  "data": {
    "user": {
      // User profile information
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Token Details

- **Lifespan**: 15 minutes
- **Format**: JWT
- **Payload**:
  ```json
  {
    "userId": "user-uuid",
    "exp": 1641234388,
    "iat": 1641233788
  }
  ```

### Usage

Include the access token in subsequent API requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Refresh Token

Refresh tokens are delivered as an HTTP-only cookie:

### Cookie Properties

- **Name**: `auth-app-refreshToken`
- **HttpOnly**: Yes (not accessible from JavaScript)
- **Secure**: Yes in production (only sent over HTTPS)
- **SameSite**: Lax
- **Path**: /
- **MaxAge**: 7 days (604800 seconds)

### Token Details

- **Lifespan**: 7 days
- **Format**: JWT
- **Payload**:
  ```json
  {
    "userId": "user-uuid",
    "type": "refresh",
    "exp": 1641839388,
    "iat": 1641233788
  }
  ```

## API Endpoints Using Tokens

### POST `/api/v1/auth/login`

Authenticates a user and returns:
- Access token in response body
- Refresh token as HTTP-only cookie

### POST `/api/v1/auth/refresh`

Uses the refresh token from the cookie to:
- Generate a new access token
- Rotate the refresh token (invalidating the old one)
- Return the new access token in the response body
- Set the new refresh token as an HTTP-only cookie

### GET `/api/v1/auth/me` (Protected)

Requires a valid access token to:
- Return the current user's profile information

### POST `/api/v1/auth/logout`

- Clears the refresh token cookie
- Invalidates tokens for the user

## Rate Limiting

To protect against brute force attacks and abuse, the API implements rate limiting on authentication endpoints:

### Rate Limit Types

1. **Global Rate Limiter**:
   - Applies to all API endpoints
   - 60 requests per minute per IP address
   - Affects all routes including protected ones

2. **Authentication Rate Limiter**:
   - Applies to sensitive auth endpoints (`/login`, `/register`, `/refresh`)
   - 5 requests per 15 minutes per IP address
   - Provides extra protection for authentication operations

3. **API Rate Limiter**:
   - Applies to general API endpoints
   - 30 requests per minute per IP address
   - Balanced protection for normal API usage

### Intelligent Request Identification

Our rate limiting uses a sophisticated identification strategy to ensure fair limits:

1. **For authenticated users**: Uses the user's ID to track limits individually
   - Prevents legitimate users from being affected by others sharing the same IP

2. **For public requests**: Uses a combination of:
   - IP address
   - Request path
   - Truncated user agent signature

This approach prevents shared IP issues (corporate networks, VPNs) while still protecting against distributed attacks.

### Rate Limit Response Headers

When a request is made, these headers are included in the response:

- `X-RateLimit-Limit`: Maximum number of requests allowed in the window
- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `X-RateLimit-Reset`: Time (in seconds) until the rate limit window resets

### Rate Limit Exceeded Response

When a rate limit is exceeded, the API returns:

```json
{
  "error": "Too many requests, please try again later"
}
```

With HTTP status code 429 (Too Many Requests).

## Error Responses

Authentication failures return appropriate 401/403 status codes with the following error formats:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes

- `INVALID_ACCESS_TOKEN`: The access token is malformed or has an invalid signature
- `ACCESS_TOKEN_EXPIRED`: The access token has expired
- `NO_REFRESH_TOKEN`: No refresh token provided in the cookie
- `INVALID_REFRESH_TOKEN`: The refresh token is malformed or has an invalid signature
- `REFRESH_TOKEN_EXPIRED`: The refresh token has expired
- `UNAUTHORIZED`: Generic authentication failure

## Token Security Considerations

1. Access tokens should be stored in memory only, never in localStorage or sessionStorage
2. Refresh tokens are automatically handled via HTTP-only cookies
3. CSRF protection is implemented on the server
4. Token validation includes signature verification, expiration checking, and user status validation 