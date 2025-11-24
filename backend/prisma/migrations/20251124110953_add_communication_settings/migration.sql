-- AlterTable
ALTER TABLE "school_settings" ADD COLUMN     "smsApiKey" TEXT,
ADD COLUMN     "smsApiSecret" TEXT,
ADD COLUMN     "smsProvider" TEXT,
ADD COLUMN     "smsSenderId" TEXT,
ADD COLUMN     "smtpFromEmail" TEXT,
ADD COLUMN     "smtpFromName" TEXT,
ADD COLUMN     "smtpHost" TEXT,
ADD COLUMN     "smtpPassword" TEXT,
ADD COLUMN     "smtpPort" INTEGER,
ADD COLUMN     "smtpSecure" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "smtpUser" TEXT;
