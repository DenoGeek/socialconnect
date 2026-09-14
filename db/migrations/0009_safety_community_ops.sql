ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspended_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "warning_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_warning_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_warning_message" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "emergency_contact_name" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "emergency_contact_phone" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "id_document_url" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "moderation_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "zahari_engagements" ADD COLUMN IF NOT EXISTS "calendly_invite_url" text;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "in_app_notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "kind" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "href" text,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "in_app_notif_user_idx" ON "in_app_notifications" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "in_app_notif_created_idx" ON "in_app_notifications" ("created_at");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "announcements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "author_user_id" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "pathway_filter" text DEFAULT 'everyone' NOT NULL,
  "city_filter" text,
  "event_id_filter" uuid,
  "send_email" boolean DEFAULT true NOT NULL,
  "send_in_app" boolean DEFAULT true NOT NULL,
  "recipient_count" integer DEFAULT 0 NOT NULL,
  "sent_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_user_id_users_id_fk"
    FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "announcements" ADD CONSTRAINT "announcements_event_id_filter_events_id_fk"
    FOREIGN KEY ("event_id_filter") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "announcements_sent_idx" ON "announcements" ("sent_at");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "panic_alerts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "note" text,
  "resolved_at" timestamp with time zone,
  "resolved_by_user_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "panic_alerts" ADD CONSTRAINT "panic_alerts_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "panic_alerts_open_idx" ON "panic_alerts" ("resolved_at");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "icebreaker_prompts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "category" text DEFAULT 'general' NOT NULL,
  "prompt" text NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "ordering" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "icebreaker_active_idx" ON "icebreaker_prompts" ("active");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "couples_community_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL UNIQUE,
  "partner_user_id" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "vetted_at" timestamp with time zone,
  "vetted_by_user_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "couples_community_members" ADD CONSTRAINT "couples_community_members_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "couples_community_status_idx" ON "couples_community_members" ("status");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "couples_community_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "author_user_id" text NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "couples_community_posts" ADD CONSTRAINT "couples_community_posts_author_user_id_users_id_fk"
    FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "couples_posts_created_idx" ON "couples_community_posts" ("created_at");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "moderation_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "kind" text NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "review_notes" text,
  "reviewed_by_user_id" text,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "moderation_items" ADD CONSTRAINT "moderation_items_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_status_idx" ON "moderation_items" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_user_idx" ON "moderation_items" ("user_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "match_contact_exchanges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "match_id" uuid NOT NULL UNIQUE,
  "user_a_shared_at" timestamp with time zone,
  "user_b_shared_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "match_contact_exchanges" ADD CONSTRAINT "match_contact_exchanges_match_id_matches_id_fk"
    FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "match_contact_match_idx" ON "match_contact_exchanges" ("match_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_nps_responses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid NOT NULL,
  "user_id" text NOT NULL,
  "score" integer NOT NULL,
  "comment" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "event_nps_responses" ADD CONSTRAINT "event_nps_responses_event_id_events_id_fk"
    FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "event_nps_responses" ADD CONSTRAINT "event_nps_responses_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_nps_event_idx" ON "event_nps_responses" ("event_id");--> statement-breakpoint
INSERT INTO "icebreaker_prompts" ("category", "prompt", "ordering")
SELECT * FROM (VALUES
  ('faith', 'What spiritual rhythm has shaped your week the most?', 1),
  ('faith', 'Which book of the Bible has been speaking to you lately — and why?', 2),
  ('values', 'What does “intentional dating” mean to you in practice?', 3),
  ('values', 'Describe a value you will not compromise on in marriage.', 4),
  ('lifestyle', 'Ideal Sunday afternoon: how would you spend it with a partner?', 5),
  ('lifestyle', 'What kind of home atmosphere are you hoping to build?', 6),
  ('fun', 'What is a small joy that always resets your mood?', 7),
  ('fun', 'Share a travel memory that still makes you smile.', 8)
) AS v(category, prompt, ordering)
WHERE NOT EXISTS (SELECT 1 FROM "icebreaker_prompts" LIMIT 1);
