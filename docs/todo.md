## Backend TODOs

- [x] Registration
- [x] Log in
- [x] Log out
- [ ] Forgot password
- [ ] Verify email
- [x] Refresh token endpoint
- [x] HTTP-only cookie
- [ ] CSRF protection
- [ ] Authorization
  - [x] Separate public and protected routes
  - [x] Create protected route examples
  - [x] Create authorization middleware to verify tokens on protected routes
  - [ ] Add token validation checks (expiration, signature, etc.)
  - [ ] Implement proper error responses for authorization failures (401/403)
  - [ ] Add documentation for token usage in API responses

Bonus

- [ ] Add role-based access control (RBAC) for different user types
- [ ] Create token blacklisting/revocation system
- [ ] Add rate limiting to the API
- [ ] Delete account

## Frontend TODOs

- [ ] Create a basic public page
- [ ] Create a basic registration UI
- [ ] Create a basic login UI
- [ ] Create a basic protected page
- [ ] Add auth protection to the protected page
- [ ] Implement a way to refresh the access token
- [ ] Implement a way to revoke the refresh token
- [ ] Implement a way to check if the user is authenticated
- [ ] Implement a way to logout the user
