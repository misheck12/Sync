import { Router } from 'express';
import { globalSearch, searchForums, searchTopics } from '../controllers/searchController';
import { authenticateToken } from '../middleware/authMiddleware';
import { tenantHandler } from '../utils/routeTypes';
import { requireActiveSubscription } from '../middleware/subscriptionMiddleware';

const router = Router();

router.use(authenticateToken);
router.use(requireActiveSubscription);

// Global search
router.get('/', tenantHandler(globalSearch));

// Specific searches
router.get('/forums', tenantHandler(searchForums));
router.get('/topics', tenantHandler(searchTopics));

export default router;
