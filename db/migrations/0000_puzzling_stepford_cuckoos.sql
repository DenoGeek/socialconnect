DO $$ BEGIN CREATE TYPE "public"."alias_mode" AS ENUM('auto', 'manual', 'elite_hidden'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."concierge_priority" AS ENUM('normal', 'high', 'urgent'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."duo_status" AS ENUM('invited', 'active', 'desynced'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'completed', 'withdrawn', 'graduated'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'sold_out', 'in_progress', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."intent_badge" AS ENUM('slow_burner', 'ready_for_covenant', 'global_professional', 'iron_sharpens_iron', 'legacy_minded', 'ready_for_marriage'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."match_status" AS ENUM('single_opt_in', 'mutual', 'rejected', 'expired'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."message_visibility" AS ENUM('user', 'concierge', 'internal'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."payment_currency" AS ENUM('KSH', 'USD'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."payment_provider" AS ENUM('tinypesa', 'mpesa', 'card', 'cytton_mmf', 'manual'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'succeeded', 'failed', 'refunded'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."program_type" AS ENUM('agano_ascent', 'marital_legacy', 'parental_legacy', 'premarital'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."property_type" AS ENUM('modern_rustic', 'highland_rustic', 'ensuite_suite', 'self_catering', 'private_cabin', 'group_unit'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."ticket_status" AS ENUM('pending_payment', 'confirmed', 'checked_in', 'no_show', 'refunded'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."ticket_tier" AS ENUM('one_day', 'two_day', 'member_exclusive', 'elite_only'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."trip_scope" AS ENUM('group', 'private'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."user_mode" AS ENUM('explorer', 'couple', 'elite'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."user_role" AS ENUM('user', 'concierge', 'admin', 'super_admin', 'facilitator', 'host', 'professional'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."user_tier" AS ENUM('free', 'explorer', 'couple', 'elite', 'concierge'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "onboarding_progress" (
	"user_id" text PRIMARY KEY NOT NULL,
	"current_step" integer DEFAULT 0 NOT NULL,
	"total_steps" integer NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_touched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"display_name" text,
	"phone" text,
	"city" text,
	"country" text DEFAULT 'KE' NOT NULL,
	"bio" text,
	"dream_date" text,
	"photo_url" text,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"intent_badges" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"values" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"looking_for" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"deal_breakers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"theological_alignment" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"spending_tier" text DEFAULT 'standard' NOT NULL,
	"onboarding_progress" integer DEFAULT 0 NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"is_public" boolean DEFAULT true NOT NULL,
	"silent_mode" boolean DEFAULT false NOT NULL,
	"flagged_for_review" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "psychometric_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_version" integer DEFAULT 1 NOT NULL,
	"step" integer NOT NULL,
	"prompt" text NOT NULL,
	"question_type" text NOT NULL,
	"options" jsonb,
	"scale_min" integer,
	"scale_max" integer,
	"category" text,
	"weight" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "psychometric_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"question_id" uuid NOT NULL,
	"answer" jsonb NOT NULL,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"tier" "user_tier" DEFAULT 'free' NOT NULL,
	"mode" "user_mode" DEFAULT 'explorer' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alias_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"event_id" uuid,
	"alias_id" uuid NOT NULL,
	"mode" "alias_mode" DEFAULT 'auto' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alias_pool" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"archetype" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alias_pool_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_prompt_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"partner_user_id" text,
	"response" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"prompt" text NOT NULL,
	"ordering" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_table_seats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_id" uuid NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"intent_theme" text,
	"capacity" integer DEFAULT 8 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"tier" "ticket_tier" NOT NULL,
	"label" text NOT NULL,
	"price_ksh" numeric(12, 2) NOT NULL,
	"price_usd" numeric(12, 2) NOT NULL,
	"capacity" integer NOT NULL,
	"sold" integer DEFAULT 0 NOT NULL,
	"member_discount_pct" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text,
	"venue" text,
	"city" text,
	"country" text DEFAULT 'KE' NOT NULL,
	"region" text,
	"hero_image_url" text,
	"gallery" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"itinerary" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"capacity" integer DEFAULT 100 NOT NULL,
	"elite_only" boolean DEFAULT false NOT NULL,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"impression_deadline_hours" integer DEFAULT 24 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "interaction_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"author_user_id" text NOT NULL,
	"subject_alias_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ticket_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"code" text NOT NULL,
	"qr_token" text NOT NULL,
	"status" "ticket_status" DEFAULT 'pending_payment' NOT NULL,
	"currency" "payment_currency" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"checked_in_at" timestamp with time zone,
	"purchased_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ticket_purchases_code_unique" UNIQUE("code"),
	CONSTRAINT "ticket_purchases_qr_token_unique" UNIQUE("qr_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "impressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"from_user_id" text NOT NULL,
	"to_user_id" text NOT NULL,
	"liked_reason" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "match_bridge_upsells" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"deal_id" uuid,
	"reasoning" text,
	"clicked_at" timestamp with time zone,
	"claimed_at" timestamp with time zone,
	"retarget_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "match_exclusions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_a_id" text NOT NULL,
	"user_b_id" text NOT NULL,
	"reason" text,
	"permanent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "match_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"author_user_id" text NOT NULL,
	"rating" integer,
	"body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"user_a_id" text NOT NULL,
	"user_b_id" text NOT NULL,
	"status" "match_status" DEFAULT 'single_opt_in' NOT NULL,
	"compatibility_score" integer,
	"shared_intents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"matched_at" timestamp with time zone,
	"bridge_upsell_sent_at" timestamp with time zone,
	"first_conversation_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "concierge_intakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"requirements" text,
	"assigned_to_user_id" text,
	"converted_user_id" text,
	"priority" "concierge_priority" DEFAULT 'high' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "concierge_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_user_id" text NOT NULL,
	"body" text NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"visibility" "message_visibility" DEFAULT 'user' NOT NULL,
	"priority" "concierge_priority" DEFAULT 'normal' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "concierge_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"assigned_concierge_id" text,
	"concierge_on_duty" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "concierge_threads_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shadow_match_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"elite_user_id" text NOT NULL,
	"candidate_user_id" text NOT NULL,
	"rationale" text,
	"silent" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coaching_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"author_user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cohorts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"facilitator_user_id" text,
	"name" text NOT NULL,
	"starts_on" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cohort_id" uuid NOT NULL,
	"primary_user_id" text NOT NULL,
	"partner_user_id" text,
	"status" "enrollment_status" DEFAULT 'active' NOT NULL,
	"graduated_at" timestamp with time zone,
	"verified_by_facilitator_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "institution_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'facilitator' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "institutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"city" text,
	"country" text DEFAULT 'KE' NOT NULL,
	"logo_url" text,
	"public_showcase" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lesson_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"completed_by_user_id" text NOT NULL,
	"reflection" text,
	"photo_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "program_lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"week" integer NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"video_url" text,
	"connection_box_url" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid,
	"kind" "program_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"duration_weeks" integer DEFAULT 10 NOT NULL,
	"unlocks_program_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hearth_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"primary_user_id" text NOT NULL,
	"partner_user_id" text,
	"rooms" integer DEFAULT 1 NOT NULL,
	"adults" integer DEFAULT 2 NOT NULL,
	"children" integer DEFAULT 0 NOT NULL,
	"check_in" timestamp with time zone NOT NULL,
	"check_out" timestamp with time zone NOT NULL,
	"currency" text DEFAULT 'KSH' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"add_ons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"key_code" text,
	"key_code_issued_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hearth_properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"host_id" uuid NOT NULL,
	"title" text NOT NULL,
	"property_type" "property_type" NOT NULL,
	"description" text,
	"region" text,
	"city" text,
	"country" text DEFAULT 'KE' NOT NULL,
	"lat" numeric(10, 6),
	"lng" numeric(10, 6),
	"gallery" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"amenities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"nightly_rate_ksh" numeric(12, 2) NOT NULL,
	"nightly_rate_usd" numeric(12, 2) NOT NULL,
	"agano_certified" boolean DEFAULT false NOT NULL,
	"connection_box_included" boolean DEFAULT false NOT NULL,
	"min_nights" integer DEFAULT 1 NOT NULL,
	"max_occupancy" integer DEFAULT 2 NOT NULL,
	"landmark_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_elite_private" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hearth_properties_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hosts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"legal_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"payout_account" text,
	"certified_at" timestamp with time zone,
	"approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "licensing_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicant_user_id" text NOT NULL,
	"property_name" text NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"compliance_checklist" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"licensing_fee_pct" integer DEFAULT 15 NOT NULL,
	"reviewer_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_add_ons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price_ksh" numeric(12, 2) NOT NULL,
	"price_usd" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"booking_id" uuid,
	"author_user_id" text NOT NULL,
	"rating" integer NOT NULL,
	"body" text,
	"host_response" text,
	"host_responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trip_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"primary_user_id" text NOT NULL,
	"partner_user_id" text,
	"installment_months" integer DEFAULT 1 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"documents_uploaded" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trip_installments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"due_on" timestamp with time zone NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"paid_at" timestamp with time zone,
	"reminder_sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"scope" "trip_scope" NOT NULL,
	"region" text,
	"facilitator_included" boolean DEFAULT false NOT NULL,
	"curriculum_included" boolean DEFAULT false NOT NULL,
	"starts_on" timestamp with time zone NOT NULL,
	"ends_on" timestamp with time zone NOT NULL,
	"total_ksh" numeric(12, 2) NOT NULL,
	"total_usd" numeric(12, 2) NOT NULL,
	"inclusive_description" text,
	"gallery" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"capacity" integer DEFAULT 10 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "trips_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "date_partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"city" text,
	"region" text,
	"lat" numeric(10, 6),
	"lng" numeric(10, 6),
	"contact_email" text,
	"contact_phone" text,
	"active" boolean DEFAULT true NOT NULL,
	"feedback_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "date_vault_deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"discount_code" text,
	"discount_pct" integer,
	"original_price_ksh" numeric(12, 2),
	"member_price_ksh" numeric(12, 2),
	"thumbnail" text,
	"vibe_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"spending_tier" text DEFAULT 'standard' NOT NULL,
	"expires_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "date_vault_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"match_id" uuid,
	"swiped_at" timestamp with time zone DEFAULT now() NOT NULL,
	"affiliate_attribution" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "professional_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"booked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "professional_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"availability_id" uuid,
	"primary_user_id" text NOT NULL,
	"partner_user_id" text,
	"video_link" text,
	"payment_confirmed_at" timestamp with time zone,
	"session_started_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "professional_quick_chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"question" text NOT NULL,
	"reply" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "professionals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"specialties" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bio" text,
	"photo_url" text,
	"tele_health_enabled" boolean DEFAULT true NOT NULL,
	"city" text,
	"rate" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"subject_kind" text NOT NULL,
	"subject_id" text NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"provider_ref" text,
	"sender_display_name" text DEFAULT 'Evermore' NOT NULL,
	"currency" "payment_currency" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"raw_webhook" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "duo_syncs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"initiator_user_id" text NOT NULL,
	"invitee_user_id" text,
	"invitee_email" text,
	"invite_token" text NOT NULL,
	"status" "duo_status" DEFAULT 'invited' NOT NULL,
	"shared_billing_method" text,
	"accepted_at" timestamp with time zone,
	"desynced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "duo_syncs_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" text,
	"action" text NOT NULL,
	"target" text,
	"diff" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regional_kill_switches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"reason" text,
	"toggled_by_user_id" text,
	"toggled_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regional_kill_switches_region_unique" UNIQUE("region")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_user_id" text NOT NULL,
	"reported_user_id" text NOT NULL,
	"reason" text NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "psychometric_responses" ADD CONSTRAINT "psychometric_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "psychometric_responses" ADD CONSTRAINT "psychometric_responses_question_id_psychometric_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."psychometric_questions"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "alias_assignments" ADD CONSTRAINT "alias_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "alias_assignments" ADD CONSTRAINT "alias_assignments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "alias_assignments" ADD CONSTRAINT "alias_assignments_alias_id_alias_pool_id_fk" FOREIGN KEY ("alias_id") REFERENCES "public"."alias_pool"("id") ON DELETE restrict ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "event_prompt_responses" ADD CONSTRAINT "event_prompt_responses_prompt_id_event_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."event_prompts"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "event_prompt_responses" ADD CONSTRAINT "event_prompt_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "event_prompt_responses" ADD CONSTRAINT "event_prompt_responses_partner_user_id_users_id_fk" FOREIGN KEY ("partner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "event_prompts" ADD CONSTRAINT "event_prompts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "event_table_seats" ADD CONSTRAINT "event_table_seats_table_id_event_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."event_tables"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "event_table_seats" ADD CONSTRAINT "event_table_seats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "event_tables" ADD CONSTRAINT "event_tables_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "event_tickets" ADD CONSTRAINT "event_tickets_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "interaction_notes" ADD CONSTRAINT "interaction_notes_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "interaction_notes" ADD CONSTRAINT "interaction_notes_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "ticket_purchases" ADD CONSTRAINT "ticket_purchases_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "ticket_purchases" ADD CONSTRAINT "ticket_purchases_ticket_id_event_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."event_tickets"("id") ON DELETE restrict ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "ticket_purchases" ADD CONSTRAINT "ticket_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "impressions" ADD CONSTRAINT "impressions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "impressions" ADD CONSTRAINT "impressions_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "impressions" ADD CONSTRAINT "impressions_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "match_bridge_upsells" ADD CONSTRAINT "match_bridge_upsells_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "match_exclusions" ADD CONSTRAINT "match_exclusions_user_a_id_users_id_fk" FOREIGN KEY ("user_a_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "match_exclusions" ADD CONSTRAINT "match_exclusions_user_b_id_users_id_fk" FOREIGN KEY ("user_b_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "match_feedback" ADD CONSTRAINT "match_feedback_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "match_feedback" ADD CONSTRAINT "match_feedback_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "matches" ADD CONSTRAINT "matches_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "matches" ADD CONSTRAINT "matches_user_a_id_users_id_fk" FOREIGN KEY ("user_a_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "matches" ADD CONSTRAINT "matches_user_b_id_users_id_fk" FOREIGN KEY ("user_b_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "concierge_intakes" ADD CONSTRAINT "concierge_intakes_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "concierge_intakes" ADD CONSTRAINT "concierge_intakes_converted_user_id_users_id_fk" FOREIGN KEY ("converted_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "concierge_messages" ADD CONSTRAINT "concierge_messages_thread_id_concierge_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."concierge_threads"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "concierge_messages" ADD CONSTRAINT "concierge_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "concierge_threads" ADD CONSTRAINT "concierge_threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "concierge_threads" ADD CONSTRAINT "concierge_threads_assigned_concierge_id_users_id_fk" FOREIGN KEY ("assigned_concierge_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "shadow_match_suggestions" ADD CONSTRAINT "shadow_match_suggestions_elite_user_id_users_id_fk" FOREIGN KEY ("elite_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "shadow_match_suggestions" ADD CONSTRAINT "shadow_match_suggestions_candidate_user_id_users_id_fk" FOREIGN KEY ("candidate_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "coaching_notes" ADD CONSTRAINT "coaching_notes_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "coaching_notes" ADD CONSTRAINT "coaching_notes_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_facilitator_user_id_users_id_fk" FOREIGN KEY ("facilitator_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_primary_user_id_users_id_fk" FOREIGN KEY ("primary_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_partner_user_id_users_id_fk" FOREIGN KEY ("partner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_verified_by_facilitator_id_users_id_fk" FOREIGN KEY ("verified_by_facilitator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "institution_members" ADD CONSTRAINT "institution_members_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "institution_members" ADD CONSTRAINT "institution_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_lesson_id_program_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."program_lessons"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_completed_by_user_id_users_id_fk" FOREIGN KEY ("completed_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "program_lessons" ADD CONSTRAINT "program_lessons_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "programs" ADD CONSTRAINT "programs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "hearth_bookings" ADD CONSTRAINT "hearth_bookings_property_id_hearth_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."hearth_properties"("id") ON DELETE restrict ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "hearth_bookings" ADD CONSTRAINT "hearth_bookings_primary_user_id_users_id_fk" FOREIGN KEY ("primary_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "hearth_bookings" ADD CONSTRAINT "hearth_bookings_partner_user_id_users_id_fk" FOREIGN KEY ("partner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "hearth_properties" ADD CONSTRAINT "hearth_properties_host_id_hosts_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "hosts" ADD CONSTRAINT "hosts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "licensing_applications" ADD CONSTRAINT "licensing_applications_applicant_user_id_users_id_fk" FOREIGN KEY ("applicant_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "licensing_applications" ADD CONSTRAINT "licensing_applications_reviewer_user_id_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "property_add_ons" ADD CONSTRAINT "property_add_ons_property_id_hearth_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."hearth_properties"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "property_reviews" ADD CONSTRAINT "property_reviews_property_id_hearth_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."hearth_properties"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "property_reviews" ADD CONSTRAINT "property_reviews_booking_id_hearth_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."hearth_bookings"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "property_reviews" ADD CONSTRAINT "property_reviews_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "trip_bookings" ADD CONSTRAINT "trip_bookings_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "trip_bookings" ADD CONSTRAINT "trip_bookings_primary_user_id_users_id_fk" FOREIGN KEY ("primary_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "trip_bookings" ADD CONSTRAINT "trip_bookings_partner_user_id_users_id_fk" FOREIGN KEY ("partner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "trip_installments" ADD CONSTRAINT "trip_installments_booking_id_trip_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."trip_bookings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "date_vault_deals" ADD CONSTRAINT "date_vault_deals_partner_id_date_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."date_partners"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "date_vault_redemptions" ADD CONSTRAINT "date_vault_redemptions_deal_id_date_vault_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."date_vault_deals"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "date_vault_redemptions" ADD CONSTRAINT "date_vault_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "date_vault_redemptions" ADD CONSTRAINT "date_vault_redemptions_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "professional_availability" ADD CONSTRAINT "professional_availability_professional_id_professionals_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "professional_bookings" ADD CONSTRAINT "professional_bookings_professional_id_professionals_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "professional_bookings" ADD CONSTRAINT "professional_bookings_availability_id_professional_availability_id_fk" FOREIGN KEY ("availability_id") REFERENCES "public"."professional_availability"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "professional_bookings" ADD CONSTRAINT "professional_bookings_primary_user_id_users_id_fk" FOREIGN KEY ("primary_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "professional_bookings" ADD CONSTRAINT "professional_bookings_partner_user_id_users_id_fk" FOREIGN KEY ("partner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "professional_quick_chats" ADD CONSTRAINT "professional_quick_chats_professional_id_professionals_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "professional_quick_chats" ADD CONSTRAINT "professional_quick_chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "professionals" ADD CONSTRAINT "professionals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "duo_syncs" ADD CONSTRAINT "duo_syncs_initiator_user_id_users_id_fk" FOREIGN KEY ("initiator_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "duo_syncs" ADD CONSTRAINT "duo_syncs_invitee_user_id_users_id_fk" FOREIGN KEY ("invitee_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "regional_kill_switches" ADD CONSTRAINT "regional_kill_switches_toggled_by_user_id_users_id_fk" FOREIGN KEY ("toggled_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reported_user_id_users_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profiles_city_idx" ON "profiles" USING btree ("city");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profiles_silent_idx" ON "profiles" USING btree ("silent_mode");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "psych_user_q_uniq" ON "psychometric_responses" USING btree ("user_id","question_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "alias_user_event_uniq" ON "alias_assignments" USING btree ("user_id","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "alias_event_alias_uniq" ON "alias_assignments" USING btree ("event_id","alias_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alias_user_idx" ON "alias_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "prompt_resp_uniq" ON "event_prompt_responses" USING btree ("prompt_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "seat_table_user_uniq" ON "event_table_seats" USING btree ("table_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "event_tier_uniq" ON "event_tickets" USING btree ("event_id","tier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_starts_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tp_user_idx" ON "ticket_purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tp_event_idx" ON "ticket_purchases" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tp_status_idx" ON "ticket_purchases" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "impression_event_pair_uniq" ON "impressions" USING btree ("event_id","from_user_id","to_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "impression_to_idx" ON "impressions" USING btree ("to_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "exclusion_pair_uniq" ON "match_exclusions" USING btree ("user_a_id","user_b_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "match_user_pair_uniq" ON "matches" USING btree ("user_a_id","user_b_id","event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "match_status_idx" ON "matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "intake_priority_idx" ON "concierge_intakes" USING btree ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "msg_thread_idx" ON "concierge_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "msg_priority_idx" ON "concierge_messages" USING btree ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enroll_status_idx" ON "enrollments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enroll_primary_idx" ON "enrollments" USING btree ("primary_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "inst_user_uniq" ON "institution_members" USING btree ("institution_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "lc_enroll_lesson_uniq" ON "lesson_completions" USING btree ("enrollment_id","lesson_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "lesson_program_week_uniq" ON "program_lessons" USING btree ("program_id","week");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_property_idx" ON "hearth_bookings" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_dates_idx" ON "hearth_bookings" USING btree ("check_in","check_out");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_status_idx" ON "hearth_bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hearth_region_idx" ON "hearth_properties" USING btree ("region");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hearth_certified_idx" ON "hearth_properties" USING btree ("agano_certified");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trip_booking_user_idx" ON "trip_bookings" USING btree ("primary_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "installment_booking_due_uniq" ON "trip_installments" USING btree ("booking_id","due_on");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deal_partner_idx" ON "date_vault_deals" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deal_active_idx" ON "date_vault_deals" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prof_active_idx" ON "professionals" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_user_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_subject_idx" ON "payments" USING btree ("subject_kind","subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "duo_users_uniq" ON "duo_syncs" USING btree ("initiator_user_id","invitee_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_actor_idx" ON "audit_log" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_created_idx" ON "audit_log" USING btree ("created_at");