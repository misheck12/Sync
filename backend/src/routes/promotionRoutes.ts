import { Router } from 'express';
import { getPromotionCandidates, processPromotions } from '../controllers/promotionController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

// Only Admins and Teachers (maybe) should handle promotions
router.get('/candidates', authorizeRole(['SUPER_ADMIN', 'TEACHER']), getPromotionCandidates);
router.post('/process', authorizeRole(['SUPER_ADMIN']), processPromotions);

export default router;
