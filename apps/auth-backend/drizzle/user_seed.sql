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

-- Create a function to get the current user id
CREATE OR REPLACE FUNCTION auth.current_user_id()
RETURNS uuid AS $$
BEGIN
  RETURN nullif(current_setting('app.current_user_id', true), '')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;