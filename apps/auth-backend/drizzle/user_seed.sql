insert into auth.users (
  id,
  email,
  hashed_password,
  email_verified,
  role
) values (
  'cb26bfec-4003-4282-8bc5-f23ab7da6244',
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
  'cb26bfec-4003-4282-8bc5-f23ab7da6244',
  'admin@example.com',
  'Admin User',
  'I am the admin user for the auth backend.'
);

-- Set password for app_user role and allow login
ALTER ROLE app_user WITH PASSWORD '201fd7a2b44b692cf44d98cd717fd0bda56d0838' LOGIN;

-- Grant connect to app_user role
GRANT CONNECT ON DATABASE "auth-backend-db" TO app_user;

-- Grant usage to app_user role
GRANT USAGE ON SCHEMA public TO app_user;
GRANT USAGE ON SCHEMA auth TO app_user;

-- Grant table permissions to app_user
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.users TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.user_connections TO app_user;