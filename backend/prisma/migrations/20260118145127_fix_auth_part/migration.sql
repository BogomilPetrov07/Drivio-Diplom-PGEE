/*
  Warnings:

  - You are about to drop the column `deviceFingerpint` on the `sessions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "refresh_tokens" ALTER COLUMN "revoked" SET DEFAULT false,
ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '7 days',
ALTER COLUMN "replacedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "deviceFingerpint",
ALTER COLUMN "revoked" SET DEFAULT false,
ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '30 days';
