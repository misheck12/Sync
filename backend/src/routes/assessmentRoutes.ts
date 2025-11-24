import { Router } from 'express';
import { 
  createAssessment, 
  getAssessments, 
  getAssessmentById,
  recordResults, 
  getAssessmentResults,
  getStudentResults 
} from '../controllers/assessmentController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

// Assessment Management
router.post('/', authorizeRole(['TEACHER', 'SUPER_ADMIN']), createAssessment);
router.get('/', getAssessments);
router.get('/:id', getAssessmentById);

// Results Management
router.post('/results', authorizeRole(['TEACHER', 'SUPER_ADMIN']), recordResults);
router.get('/:id/results', getAssessmentResults);

// Student specific
router.get('/student/:studentId', getStudentResults);

export default router;
