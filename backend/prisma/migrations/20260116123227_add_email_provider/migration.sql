/*
  Warnings:

  - The `interestedTier` column on the `crm_leads` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tier` column on the `tenants` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `proposedTier` on the `crm_deals` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tier` on the `subscription_plans` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "crm_deals" DROP COLUMN "proposedTier",
ADD COLUMN     "proposedTier" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "crm_leads" DROP COLUMN "interestedTier",
ADD COLUMN     "interestedTier" TEXT;

-- AlterTable
ALTER TABLE "platform_settings" ADD COLUMN     "availableFeatures" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "availableTiers" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "monthlyApiCallLimit" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "tier",
ADD COLUMN     "tier" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "emailProvider" TEXT DEFAULT 'smtp',
DROP COLUMN "tier",
ADD COLUMN     "tier" TEXT NOT NULL DEFAULT 'FREE';

-- DropEnum
DROP TYPE "SubscriptionTier";

-- CreateTable
CREATE TABLE "subscription_tiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_tiers_value_key" ON "subscription_tiers"("value");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_tier_key" ON "subscription_plans"("tier");
