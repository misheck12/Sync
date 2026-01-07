import { Router } from 'express';
import {
  addQuestionsToAssessment,
  getAssessmentQuestions,
  getQuizForStudent,
  submitQuiz,
  getStudentAssessments
} from '../controllers/onlineAssessmentController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

// Teacher routes
router.post('/:assessmentId/questions', authorizeRole(['TEACHER', 'SUPER_ADMIN']), addQuestionsToAssessment);
router.get('/:assessmentId/questions', authorizeRole(['TEACHER', 'SUPER_ADMIN']), getAssessmentQuestions);

// Student routes
router.get('/student/my-assessments', authorizeRole(['STUDENT', 'TEACHER', 'SUPER_ADMIN', 'PARENT']), getStudentAssessments);
router.get('/:assessmentId/take', authorizeRole(['STUDENT', 'TEACHER', 'SUPER_ADMIN']), getQuizForStudent);
router.post('/:assessmentId/submit', authorizeRole(['STUDENT', 'TEACHER', 'SUPER_ADMIN']), submitQuiz);

export default router;
