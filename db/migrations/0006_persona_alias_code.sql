-- Persona alias base names may repeat; unique auto-generated code disambiguates.
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "persona_alias_code" integer;

DROP INDEX IF EXISTS "profiles_persona_alias_lower_uniq";

CREATE UNIQUE INDEX IF NOT EXISTS "profiles_persona_alias_code_uniq"
ON "profiles" ("persona_alias_code")
WHERE "persona_alias_code" IS NOT NULL;
