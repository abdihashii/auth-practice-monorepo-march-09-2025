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

-- Create a function that will help identify the current user
CREATE OR REPLACE FUNCTION auth.get_current_user_id()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', TRUE), '')::uuid;
$$;

-- Create a Function to Check if in Service Context
CREATE OR REPLACE FUNCTION auth.is_service_request()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('app.is_service_request', TRUE), '')::boolean;
$$;