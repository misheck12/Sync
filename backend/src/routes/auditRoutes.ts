import { Router } from 'express';
import { tenantHandler } from '../utils/routeTypes';
import { getAuditLogs, getAuditFilters } from '../controllers/auditController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', tenantHandler(getAuditLogs));
router.get('/filters', tenantHandler(getAuditFilters));

export default router;
