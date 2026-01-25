-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "signature" TEXT,
ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '7 days';

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "signature" TEXT,
ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '30 days';
