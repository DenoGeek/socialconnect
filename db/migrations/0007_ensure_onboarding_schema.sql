-- Safety net: ensure Create Profile columns exist even if an earlier migration
-- was recorded in __drizzle_migrations without applying successfully.
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "first_name" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "last_name" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "birth_year" integer;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "country_of_heritage" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "familial_status" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "divorce_certified" boolean DEFAULT false NOT NULL;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "children_count" integer;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "children_custody" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "education_level" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "profession" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "primary_industry" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "persona_category" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "persona_alias" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "altar_timeline" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "relocation_openness" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "family_planning_vision" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "spiritual_rhythms_home" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "doctrinal_alignment" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "professional_rhythm" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "financial_stewardship" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "environment_preference" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "hospitality_flow" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "family_status_compatibility" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "household_blueprint" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "core_faith_identity" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "household_leadership" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "doctrinal_flexibility" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "desired_future_children" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "covenant_foundations_safeguard" boolean DEFAULT false NOT NULL;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "persona_alias_code" integer;

DROP INDEX IF EXISTS "profiles_persona_alias_lower_uniq";

CREATE UNIQUE INDEX IF NOT EXISTS "profiles_persona_alias_code_uniq"
ON "profiles" ("persona_alias_code")
WHERE "persona_alias_code" IS NOT NULL;
