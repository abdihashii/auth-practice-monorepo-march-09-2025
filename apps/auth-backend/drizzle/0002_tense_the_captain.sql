CREATE POLICY "users_policy" ON "auth"."users" AS PERMISSIVE FOR ALL TO public USING (
      (select auth.get_current_user_id()) = "auth"."users"."id"
      OR auth.is_service_request() = TRUE
    );--> statement-breakpoint
CREATE POLICY "profiles_policy" ON "public"."profiles" AS PERMISSIVE FOR ALL TO public USING (
      (select auth.get_current_user_id()) = "public"."profiles"."user_id"
      OR auth.is_service_request() = TRUE
    );