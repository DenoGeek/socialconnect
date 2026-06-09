CREATE UNIQUE INDEX IF NOT EXISTS "profiles_persona_alias_lower_uniq"
ON "profiles" (lower("persona_alias"))
WHERE "persona_alias" IS NOT NULL;
