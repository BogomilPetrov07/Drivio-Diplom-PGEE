/*
  Warnings:

  - You are about to drop the column `device` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `ip` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the `BannedSlots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CachedSlots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudentHistorySlots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UnattendedZones` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkSchedules` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BannedSlots" DROP CONSTRAINT "BannedSlots_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "CachedSlots" DROP CONSTRAINT "CachedSlots_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "StudentHistorySlots" DROP CONSTRAINT "StudentHistorySlots_studentProfileId_fkey";

-- DropForeignKey
ALTER TABLE "UnattendedZones" DROP CONSTRAINT "UnattendedZones_studentProfileId_fkey";

-- DropForeignKey
ALTER TABLE "WorkSchedules" DROP CONSTRAINT "WorkSchedules_instructorId_fkey";

-- AlterTable
ALTER TABLE "RefreshToken" DROP COLUMN "device",
DROP COLUMN "ip",
DROP COLUMN "userId",
ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '7 days';

-- DropTable
DROP TABLE "BannedSlots";

-- DropTable
DROP TABLE "CachedSlots";

-- DropTable
DROP TABLE "StudentHistorySlots";

-- DropTable
DROP TABLE "UnattendedZones";

-- DropTable
DROP TABLE "WorkSchedules";

-- CreateTable
CREATE TABLE "Sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "deviceFingerpint" TEXT NOT NULL,

    CONSTRAINT "Sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityTemplate" (
    "id" TEXT NOT NULL,
    "dayName" "WeekDays" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "instructorId" TEXT NOT NULL,

    CONSTRAINT "AvailabilityTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructorBlockout" (
    "id" TEXT NOT NULL,
    "reason" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "instructorId" TEXT NOT NULL,

    CONSTRAINT "InstructorBlockout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "instructorId" TEXT NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentUnavailability" (
    "id" TEXT NOT NULL,
    "dayName" "WeekDays",
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "studentProfileId" TEXT NOT NULL,

    CONSTRAINT "StudentUnavailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonHistory" (
    "id" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "rating" INTEGER,
    "slotId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,

    CONSTRAINT "LessonHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonHistory_slotId_key" ON "LessonHistory"("slotId");

-- AddForeignKey
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityTemplate" ADD CONSTRAINT "AvailabilityTemplate_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "InstructorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorBlockout" ADD CONSTRAINT "InstructorBlockout_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "InstructorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "InstructorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentUnavailability" ADD CONSTRAINT "StudentUnavailability_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonHistory" ADD CONSTRAINT "LessonHistory_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "TimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonHistory" ADD CONSTRAINT "LessonHistory_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
