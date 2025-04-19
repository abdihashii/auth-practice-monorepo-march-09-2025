ALTER TABLE "auth"."users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "user_can_select_self" ON "auth"."users" AS PERMISSIVE FOR SELECT TO "app_user" USING ((select auth.current_user_id()) = id);