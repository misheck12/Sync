import { Router } from 'express';
import { getAcademicTerms, createAcademicTerm, updateAcademicTerm, deleteAcademicTerm } from '../controllers/academicTermController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getAcademicTerms);
router.post('/', authorizeRole(['SUPER_ADMIN']), createAcademicTerm);
router.put('/:id', authorizeRole(['SUPER_ADMIN']), updateAcademicTerm);
router.delete('/:id', authorizeRole(['SUPER_ADMIN']), deleteAcademicTerm);

export default router;
