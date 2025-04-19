insert into auth.users (
  email,
  hashed_password,
  email_verified,
  role
) values (
  'admin@example.com',
  'Test=123', -- setting password to Test=123 for testing purposes
  true,
  'admin'
);

insert into public.profiles (
  user_id,
  email,
  name,
  bio
) values (
  'enter the created user id here',
  'admin@example.com',
  'Admin User',
  'I am the admin user for the auth backend.'
);

-- Set password for app_user role
ALTER ROLE app_user WITH PASSWORD '201fd7a2b44b692cf44d98cd717fd0bda56d0838';