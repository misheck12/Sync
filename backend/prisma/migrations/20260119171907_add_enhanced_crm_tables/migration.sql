/*
  Warnings:

  - You are about to drop the column `lastViewedAt` on the `crm_documents` table. All the data in the column will be lost.
  - You are about to drop the column `parentDocumentId` on the `crm_documents` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `crm_documents` table. All the data in the column will be lost.
  - You are about to drop the column `viewCount` on the `crm_documents` table. All the data in the column will be lost.
  - You are about to drop the column `attachments` on the `crm_emails` table. All the data in the column will be lost.
  - You are about to drop the column `clickedAt` on the `crm_emails` table. All the data in the column will be lost.
  - You are about to drop the column `isHtml` on the `crm_emails` table. All the data in the column will be lost.
  - You are about to drop the column `openedAt` on the `crm_emails` table. All the data in the column will be lost.
  - You are about to drop the column `retryCount` on the `crm_emails` table. All the data in the column will be lost.
  - You are about to drop the column `websiteVisits` on the `crm_lead_scores` table. All the data in the column will be lost.
  - You are about to alter the column `quantity` on the `crm_quote_items` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - You are about to drop the column `pdfUrl` on the `crm_quotes` table. All the data in the column will be lost.
  - You are about to drop the `crm_follow_up_reminders` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `leadId` on table `crm_emails` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `crm_quote_items` table without a default value. This is not possible if the table is not empty.
  - Made the column `generatedById` on table `crm_reports` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "crm_email_templates" DROP CONSTRAINT "crm_email_templates_createdById_fkey";

-- DropForeignKey
ALTER TABLE "crm_emails" DROP CONSTRAINT "crm_emails_leadId_fkey";

-- DropForeignKey
ALTER TABLE "crm_follow_up_reminders" DROP CONSTRAINT "crm_follow_up_reminders_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "crm_follow_up_reminders" DROP CONSTRAINT "crm_follow_up_reminders_leadId_fkey";

-- DropForeignKey
ALTER TABLE "crm_reports" DROP CONSTRAINT "crm_reports_generatedById_fkey";

-- DropIndex
DROP INDEX "crm_documents_category_idx";

-- DropIndex
DROP INDEX "crm_emails_status_idx";

-- DropIndex
DROP INDEX "crm_quotes_dealId_idx";

-- DropIndex
DROP INDEX "crm_quotes_leadId_idx";

-- DropIndex
DROP INDEX "crm_quotes_status_idx";

-- DropIndex
DROP INDEX "crm_reports_periodStart_periodEnd_idx";

-- DropIndex
DROP INDEX "crm_reports_reportType_idx";

-- AlterTable
ALTER TABLE "crm_documents" DROP COLUMN "lastViewedAt",
DROP COLUMN "parentDocumentId",
DROP COLUMN "version",
DROP COLUMN "viewCount",
ALTER COLUMN "fileSize" DROP NOT NULL,
ALTER COLUMN "fileType" DROP NOT NULL,
ALTER COLUMN "mimeType" DROP NOT NULL,
ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "category" DROP DEFAULT;

-- AlterTable
ALTER TABLE "crm_email_templates" ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "category" DROP DEFAULT,
ALTER COLUMN "variables" DROP DEFAULT,
ALTER COLUMN "createdById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "crm_emails" DROP COLUMN "attachments",
DROP COLUMN "clickedAt",
DROP COLUMN "isHtml",
DROP COLUMN "openedAt",
DROP COLUMN "retryCount",
ALTER COLUMN "leadId" SET NOT NULL,
ALTER COLUMN "ccEmails" DROP DEFAULT,
ALTER COLUMN "bccEmails" DROP DEFAULT;

-- AlterTable
ALTER TABLE "crm_lead_scores" DROP COLUMN "websiteVisits",
ALTER COLUMN "grade" SET DEFAULT 'D';

-- AlterTable
ALTER TABLE "crm_quote_items" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "quantity" DROP DEFAULT,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "crm_quotes" DROP COLUMN "pdfUrl";

-- AlterTable
ALTER TABLE "crm_reports" ALTER COLUMN "generatedById" SET NOT NULL;

-- DropTable
DROP TABLE "crm_follow_up_reminders";

-- CreateTable
CREATE TABLE "crm_reminders" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reminderDate" TIMESTAMP(3) NOT NULL,
    "reminderType" TEXT,
    "priority" TEXT,
    "assignedToId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "snoozeUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_reminders_assignedToId_idx" ON "crm_reminders"("assignedToId");

-- CreateIndex
CREATE INDEX "crm_reminders_reminderDate_idx" ON "crm_reminders"("reminderDate");

-- AddForeignKey
ALTER TABLE "crm_emails" ADD CONSTRAINT "crm_emails_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_email_templates" ADD CONSTRAINT "crm_email_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "platform_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_reminders" ADD CONSTRAINT "crm_reminders_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_reminders" ADD CONSTRAINT "crm_reminders_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "platform_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_reports" ADD CONSTRAINT "crm_reports_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "platform_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
