## Backend TODOs

- [x] Registration
- [x] Log in
- [x] Log out
- [ ] Forgot password
- [x] Verify email
- [x] Refresh token endpoint
- [x] HTTP-only cookie
- [x] CSRF protection
- [x] Rate limiting
- [x] Change password
- Authorization
  - [x] Separate public and protected routes
  - [x] Create protected route examples
  - [x] Create authorization middleware to verify tokens on protected routes
  - [x] Add token validation checks (expiration, signature, etc.)
  - [x] Implement proper error responses for authorization failures (401/403)
  - [x] Add documentation for token usage in API responses
- [ ] Row level security (RLS)

Bonus

- [ ] Add role-based access control (RBAC) for different user types
- [ ] Create token blacklisting/revocation system
- [ ] Delete account

## Frontend TODOs

- [x] Create a basic public page
- [x] Create a basic registration UI
- [x] Create a basic login UI
- [x] Create a basic protected page
- [x] Add auth protection to the protected page
- [ ] Implement a way to refresh the access token
- [ ] Implement a way to revoke the refresh token
- [x] Implement a way to check if the user is authenticated
- [x] Implement a way to logout the user
- [x] Eslint
- [ ] Link/unlink social accounts
- Create a basic user management UI
  - User profile page
    - [ ] User profile picture support
    - [x] User name support
    - [x] User bio support
  - [x] Change password page
  - [ ] 2FA page
  - [ ] Connected accounts page (social logins)
  - [ ] User preferences page
  - [ ] Delete account page
