/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "users_tenantId_email_key";

-- AlterTable
ALTER TABLE "platform_settings" ADD COLUMN     "airtelMoneyApiUrl" TEXT,
ADD COLUMN     "airtelMoneyClientId" TEXT,
ADD COLUMN     "airtelMoneyClientSecret" TEXT,
ADD COLUMN     "airtelMoneyEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoConfirmThreshold" DECIMAL(10,2),
ADD COLUMN     "bankAccountName" TEXT DEFAULT 'Sync Technologies Ltd',
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankBranchCode" TEXT,
ADD COLUMN     "bankName" TEXT DEFAULT 'Zanaco',
ADD COLUMN     "bankSwiftCode" TEXT,
ADD COLUMN     "bankTransferEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lencoApiToken" TEXT,
ADD COLUMN     "lencoApiUrl" TEXT DEFAULT 'https://api.lenco.co/access/v2',
ADD COLUMN     "lencoEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lencoWebhookSecret" TEXT,
ADD COLUMN     "mtnMomoApiKey" TEXT,
ADD COLUMN     "mtnMomoApiUrl" TEXT,
ADD COLUMN     "mtnMomoApiUserId" TEXT,
ADD COLUMN     "mtnMomoEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mtnMomoSubscriptionKey" TEXT,
ADD COLUMN     "paymentCurrency" TEXT NOT NULL DEFAULT 'ZMW',
ADD COLUMN     "paymentWebhookUrl" TEXT;

-- CreateTable
CREATE TABLE "platform_audit_logs" (
    "id" TEXT NOT NULL,
    "platformUserId" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_audit_logs_platformUserId_idx" ON "platform_audit_logs"("platformUserId");

-- CreateIndex
CREATE INDEX "platform_audit_logs_action_idx" ON "platform_audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_platformUserId_fkey" FOREIGN KEY ("platformUserId") REFERENCES "platform_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
