-- AlterTable
ALTER TABLE "school_settings" ADD COLUMN     "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "feeReminderDaysBefore" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "feeReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "overdueReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "overdueReminderFrequency" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "smsNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false;
