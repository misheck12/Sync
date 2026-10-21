import { Router } from 'express';
import { getPublicPricing } from '../controllers/websitePricingController';

const router = Router();

// Anonymous, read-only marketing data. General API rate limiting is applied in app.ts.
router.get('/pricing', getPublicPricing);

export default router;