import { Router } from 'express';
import { getFeeTemplates, createFeeTemplate, assignFeeToClass } from '../controllers/feeController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/templates', getFeeTemplates);
router.post('/templates', authorizeRole(['SUPER_ADMIN', 'BURSAR']), createFeeTemplate);
router.post('/assign-class', authorizeRole(['SUPER_ADMIN', 'BURSAR']), assignFeeToClass);

export default router;
