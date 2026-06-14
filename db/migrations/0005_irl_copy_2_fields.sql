-- IRL App Copy 2 — family planning follow-up + covenant foundations safeguard.
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "desired_future_children" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "covenant_foundations_safeguard" boolean DEFAULT false NOT NULL;
