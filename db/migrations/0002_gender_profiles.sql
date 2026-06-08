DO $$ BEGIN
  CREATE TYPE "gender" AS ENUM('man', 'woman');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "gender" "gender";
