import { Request, Response } from 'express';
import { TenantPlan } from '@prisma/client';
import { systemPrisma } from '../utils/prisma';
import { DEFAULT_PLAN_PRICING } from '../services/platformBillingService';

const DISPLAY_PLANS: TenantPlan[] = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];

/** Public product pricing only. Never expose tenant overrides, invoices or provider credentials. */
export const getPublicPricing = async (_req: Request, res: Response) => {
  try {
    const [configured, policy] = await Promise.all([
      systemPrisma.platformPlanPricing.findMany({
        select: {
          plan: true,
          pricePerActiveStudent: true,
          minimumMonthlyBill: true,
          setupFeeAmount: true,
          setupFeeWaivedOnAnnual: true,
          aiIncludedUnits: true,
          smsIncludedUnits: true,
        },
      }),
      systemPrisma.platformBillingSettings.findUnique({
        where: { singleton: true },
        select: { supportFeeBasic: true, annualDiscountPercent: true, trialAiIncludedUnits: true, trialSmsIncludedUnits: true },
      }),
    ]);

    const byPlan = new Map(configured.map(row => [row.plan, row]));
    const plans = DISPLAY_PLANS.map(plan => {
      const row = byPlan.get(plan);
      const defaults = DEFAULT_PLAN_PRICING[plan];
      return {
        plan,
        pricePerActiveStudent: row ? Number(row.pricePerActiveStudent) : defaults.pricePerActiveStudent,
        minimumMonthlyBill: row ? Number(row.minimumMonthlyBill) : defaults.minimumMonthlyBill,
        setupFeeAmount: row ? Number(row.setupFeeAmount) : defaults.setupFeeAmount,
        setupFeeWaivedOnAnnual: row?.setupFeeWaivedOnAnnual ?? defaults.setupFeeWaivedOnAnnual,
        aiIncludedUnits: plan === 'FREE' ? (policy?.trialAiIncludedUnits ?? 200) : (row?.aiIncludedUnits ?? defaults.aiIncludedUnits),
        smsIncludedUnits: plan === 'FREE' ? (policy?.trialSmsIncludedUnits ?? 50) : (row?.smsIncludedUnits ?? defaults.smsIncludedUnits),
      };
    });

    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      success: true,
      currency: 'ZMW',
      billingBasis: 'ACTIVE_STUDENTS',
      supportFeeBasic: policy ? Number(policy.supportFeeBasic) : 150,
      annualDiscountPercent: policy ? Number(policy.annualDiscountPercent) : 16.67,
      plans,
    });
  } catch (error) {
    console.error('Public pricing error:', error);
    res.status(503).json({ error: 'Pricing is temporarily unavailable. Please contact our team for a quote.' });
  }
};