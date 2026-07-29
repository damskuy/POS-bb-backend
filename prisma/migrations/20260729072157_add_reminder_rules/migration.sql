/*
  Warnings:

  - You are about to drop the column `price` on the `service_packages` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ReminderTriggerType" AS ENUM ('DAYS', 'KM', 'BOTH');

-- CreateEnum
CREATE TYPE "ReminderCategory" AS ENUM ('SERVIS', 'PERAWATAN', 'BAN', 'KELISTRIKAN', 'REM');

-- AlterTable
ALTER TABLE "service_packages" DROP COLUMN "price",
ADD COLUMN     "unitPrice" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" INTEGER,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_rules" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ReminderCategory" NOT NULL DEFAULT 'SERVIS',
    "triggerType" "ReminderTriggerType" NOT NULL DEFAULT 'DAYS',
    "daysInterval" INTEGER,
    "kmInterval" INTEGER,
    "messageTemplate" TEXT NOT NULL,
    "sendTime" TEXT NOT NULL DEFAULT '09:00',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "sendDays" TEXT NOT NULL DEFAULT 'Senin - Sabtu',
    "skipHolidays" BOOLEAN NOT NULL DEFAULT true,
    "retryOnFailure" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "reminder_rules_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
