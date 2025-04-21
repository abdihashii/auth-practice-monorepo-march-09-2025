ALTER POLICY "users_policy" ON "auth"."users" TO public USING (
      ((select auth.get_current_user_id()) IS NOT NULL AND (select auth.get_current_user_id()) = "auth"."users"."id")
      OR
      (auth.is_service_request() = TRUE)
    );--> statement-breakpoint
ALTER POLICY "profiles_policy" ON "profiles" TO public USING (
      ((select auth.get_current_user_id()) IS NOT NULL AND (select auth.get_current_user_id()) = "profiles"."user_id")
      OR
      (auth.is_service_request() = TRUE)
    );