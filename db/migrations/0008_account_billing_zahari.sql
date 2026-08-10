DO $$ BEGIN
  CREATE TYPE "public"."zahari_plan" AS ENUM('6_months', '1_year');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."payment_method_kind" AS ENUM('mpesa_phone', 'tinypesa', 'paybill', 'card');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TYPE "public"."zahari_engagement_status" ADD VALUE IF NOT EXISTS 'pending_interview';--> statement-breakpoint
ALTER TYPE "public"."zahari_engagement_status" ADD VALUE IF NOT EXISTS 'interview_scheduled';--> statement-breakpoint
ALTER TYPE "public"."zahari_engagement_status" ADD VALUE IF NOT EXISTS 'interview_rejected';--> statement-breakpoint
ALTER TYPE "public"."zahari_engagement_status" ADD VALUE IF NOT EXISTS 'cancelled';--> statement-breakpoint
ALTER TYPE "public"."zahari_engagement_status" ADD VALUE IF NOT EXISTS 'expired';--> statement-breakpoint
ALTER TABLE "zahari_engagements" ADD COLUMN IF NOT EXISTS "plan" "zahari_plan";--> statement-breakpoint
ALTER TABLE "zahari_engagements" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "zahari_engagements" ADD COLUMN IF NOT EXISTS "auto_renew" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "zahari_engagements" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "zahari_engagements" ADD COLUMN IF NOT EXISTS "cancel_reason" text;--> statement-breakpoint
ALTER TABLE "zahari_engagements" ADD COLUMN IF NOT EXISTS "interview_scheduled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "zahari_engagements" ADD COLUMN IF NOT EXISTS "interview_meeting_url" text;--> statement-breakpoint
ALTER TABLE "zahari_engagements" ADD COLUMN IF NOT EXISTS "interview_notes" text;--> statement-breakpoint
ALTER TABLE "zahari_engagements" ADD COLUMN IF NOT EXISTS "interview_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "zahari_engagements" ALTER COLUMN "status" SET DEFAULT 'pending_interview';--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "matchmaking_visible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "notification_prefs" jsonb DEFAULT '{"email":true,"sms":true,"inApp":true,"matches":true,"events":true,"community":true}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "location_preferences" text;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_methods" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "kind" "payment_method_kind" NOT NULL,
  "label" text NOT NULL,
  "mpesa_phone" text,
  "is_default" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_methods_user_idx" ON "payment_methods" ("user_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "match_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "match_id" uuid NOT NULL,
  "sender_user_id" text NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "match_messages" ADD CONSTRAINT "match_messages_match_id_matches_id_fk"
    FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "match_messages" ADD CONSTRAINT "match_messages_sender_user_id_users_id_fk"
    FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "match_msg_match_idx" ON "match_messages" ("match_id");
