-- The model no longer exposes the term-financial tables/columns added in
-- 20260513180817. Reconcile the migration chain for a NEW target database.
-- Never apply this migration to the legacy production database. Abort rather
-- than discard any term assignments or historical financial summaries.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "term_financial_summaries")
     OR EXISTS (SELECT 1 FROM "student_fee_structures")
     OR EXISTS (SELECT 1 FROM "payments" WHERE "academicTermId" IS NOT NULL) THEN
    RAISE EXCEPTION 'Term financial data exists: reconcile it explicitly before applying this migration';
  END IF;
END
$$;

ALTER TABLE "payments" DROP CONSTRAINT "payments_academicTermId_fkey";
ALTER TABLE "student_fee_structures" DROP CONSTRAINT "student_fee_structures_academicTermId_fkey";
ALTER TABLE "term_financial_summaries" DROP CONSTRAINT "term_financial_summaries_academicTermId_fkey";
ALTER TABLE "term_financial_summaries" DROP CONSTRAINT "term_financial_summaries_branchId_fkey";

DROP INDEX "payments_academicTermId_paymentDate_idx";
DROP INDEX "payments_studentId_academicTermId_idx";
DROP INDEX "student_fee_structures_academicTermId_idx";
DROP INDEX "student_fee_structures_studentId_academicTermId_idx";
DROP INDEX "student_fee_structures_studentId_feeTemplateId_academicTerm_key";

ALTER TABLE "payments" DROP COLUMN "academicTermId";
ALTER TABLE "push_subscriptions" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "student_fee_structures" DROP COLUMN "academicTermId";
DROP TABLE "term_financial_summaries";

CREATE UNIQUE INDEX "student_fee_structures_studentId_feeTemplateId_key"
  ON "student_fee_structures"("studentId", "feeTemplateId");