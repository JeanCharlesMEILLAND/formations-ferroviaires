-- Colonnes poussées en mars 2026 avec `prisma db push` sans migration ; rattrapage idempotent.
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "uaiCode" TEXT;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "Formation" ADD COLUMN IF NOT EXISTS "romeCode" TEXT;
CREATE INDEX IF NOT EXISTS "Establishment_uaiCode_idx" ON "Establishment"("uaiCode");
