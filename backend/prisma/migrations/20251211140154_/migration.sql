/*
  Warnings:

  - A unique constraint covering the columns `[studentId,feeTemplateId]` on the table `student_fee_structures` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `student_fee_structures` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "student_fee_structures" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "student_fee_structures_studentId_feeTemplateId_key" ON "student_fee_structures"("studentId", "feeTemplateId");
