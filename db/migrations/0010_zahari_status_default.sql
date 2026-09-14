-- Must be a separate migration from the ADD VALUE statements in 0008.
-- Postgres rejects using a newly added enum value in the same transaction
-- that introduced it (error 55P04).
ALTER TABLE "zahari_engagements" ALTER COLUMN "status" SET DEFAULT 'pending_interview';
