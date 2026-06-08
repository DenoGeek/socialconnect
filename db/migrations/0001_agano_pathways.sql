DO $$ BEGIN CREATE TYPE "public"."member_pathway" AS ENUM('amari', 'zahari'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."vetting_status" AS ENUM('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."application_status" AS ENUM('draft', 'submitted', 'in_review', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."zahari_engagement_status" AS ENUM('pending_payment', 'active', 'matched', 'completed'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."introduction_status" AS ENUM('presented', 'accepted', 'declined', 'scheduled', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."event_kind" AS ENUM('social', 'pulse_retreat'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pathway" "member_pathway";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "vetting_status" "vetting_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "kind" "event_kind" DEFAULT 'social' NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "member_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"pathway" "member_pathway" NOT NULL,
	"status" "application_status" DEFAULT 'draft' NOT NULL,
	"age_attested" integer,
	"city" text,
	"intent_summary" text,
	"professional_context" text,
	"discretion_requirements" text,
	"legacy_goals" text,
	"opt_into_candidate_pool" boolean DEFAULT false NOT NULL,
	"reviewed_by_user_id" text,
	"review_notes" text,
	"rejection_reason" text,
	"submitted_at" timestamp with time zone,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "candidate_pool_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL UNIQUE,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "zahari_engagements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL UNIQUE,
	"status" "zahari_engagement_status" DEFAULT 'pending_payment' NOT NULL,
	"sovereign_search_fee_usd" numeric(12, 2) DEFAULT '1500' NOT NULL,
	"covenant_activation_fee_usd" numeric(12, 2) DEFAULT '1000' NOT NULL,
	"sovereign_paid_at" timestamp with time zone,
	"activation_paid_at" timestamp with time zone,
	"matchmaker_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "zahari_introductions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"engagement_id" uuid NOT NULL,
	"candidate_user_id" text NOT NULL,
	"status" "introduction_status" DEFAULT 'presented' NOT NULL,
	"presentation_summary" text,
	"client_response" text,
	"feedback" text,
	"date_planned_at" timestamp with time zone,
	"deal_id" uuid,
	"presented_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "member_applications" ADD CONSTRAINT "member_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "member_applications" ADD CONSTRAINT "member_applications_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "candidate_pool_members" ADD CONSTRAINT "candidate_pool_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "zahari_engagements" ADD CONSTRAINT "zahari_engagements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "zahari_engagements" ADD CONSTRAINT "zahari_engagements_matchmaker_user_id_users_id_fk" FOREIGN KEY ("matchmaker_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "zahari_introductions" ADD CONSTRAINT "zahari_introductions_engagement_id_zahari_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."zahari_engagements"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "zahari_introductions" ADD CONSTRAINT "zahari_introductions_candidate_user_id_users_id_fk" FOREIGN KEY ("candidate_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_user_idx" ON "member_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_status_idx" ON "member_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_pathway_idx" ON "member_applications" USING btree ("pathway");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "candidate_pool_active_idx" ON "candidate_pool_members" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "zahari_eng_status_idx" ON "zahari_engagements" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "zahari_intro_eng_idx" ON "zahari_introductions" USING btree ("engagement_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "zahari_intro_status_idx" ON "zahari_introductions" USING btree ("status");--> statement-breakpoint
UPDATE "users" SET "vetting_status" = 'approved', "pathway" = 'zahari' WHERE "tier" IN ('elite', 'concierge') AND "role" IN ('user', 'concierge');--> statement-breakpoint
UPDATE "users" SET "vetting_status" = 'approved', "pathway" = 'amari' WHERE "vetting_status" = 'pending' AND ("tier" IN ('free', 'explorer', 'couple') OR "role" IN ('admin', 'super_admin', 'facilitator', 'host', 'professional'));--> statement-breakpoint
UPDATE "users" SET "vetting_status" = 'approved' WHERE "role" IN ('admin', 'super_admin', 'concierge');
