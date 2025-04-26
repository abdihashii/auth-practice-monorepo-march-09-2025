CREATE TYPE "public"."auth_provider" AS ENUM('email', 'google', 'github', 'apple');--> statement-breakpoint
CREATE TABLE "auth"."user_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "public"."auth_provider" NOT NULL,
	"provider_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "auth"."user_connections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth"."users" ALTER COLUMN "hashed_password" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."user_connections" ADD CONSTRAINT "user_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_provider_idx" ON "auth"."user_connections" USING btree ("user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_user_id_idx" ON "auth"."user_connections" USING btree ("provider","provider_user_id");--> statement-breakpoint
CREATE POLICY "user_connections_policy" ON "auth"."user_connections" AS PERMISSIVE FOR ALL TO public USING (
      ((select auth.get_current_user_id()) IS NOT NULL AND (select auth.get_current_user_id()) = "auth"."user_connections"."user_id")
      OR
      (auth.is_service_request() = TRUE)
    );