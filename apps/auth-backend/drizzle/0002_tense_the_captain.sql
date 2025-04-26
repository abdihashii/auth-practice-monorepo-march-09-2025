-- Create a function that will help identify the current user
CREATE OR REPLACE FUNCTION auth.get_current_user_id()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT 
    CASE 
      WHEN current_setting('app.current_user_id', TRUE) = '' THEN NULL
      WHEN current_setting('app.current_user_id', TRUE) IS NULL THEN NULL
      ELSE current_setting('app.current_user_id', TRUE)::uuid
    END;
$$;

-- Create a Function to Check if in Service Context
CREATE OR REPLACE FUNCTION auth.is_service_request()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT 
    CASE 
      WHEN current_setting('app.is_service_request', TRUE) = 'true' THEN TRUE
      WHEN current_setting('app.is_service_request', TRUE) = 't' THEN TRUE
      ELSE FALSE
    END;
$$;

CREATE POLICY "users_policy" ON "auth"."users" AS PERMISSIVE FOR ALL TO public USING (
      (select auth.get_current_user_id()) = "auth"."users"."id"
      OR auth.is_service_request() = TRUE
    );--> statement-breakpoint
CREATE POLICY "profiles_policy" ON "public"."profiles" AS PERMISSIVE FOR ALL TO public USING (
      (select auth.get_current_user_id()) = "public"."profiles"."user_id"
      OR auth.is_service_request() = TRUE
    );