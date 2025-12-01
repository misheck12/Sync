import { Router } from 'express';
import { recordAttendance, getClassAttendance, getStudentAttendance } from '../controllers/attendanceController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/', authorizeRole(['TEACHER', 'SUPER_ADMIN', 'SCHOOL_ADMIN']), recordAttendance);
router.get('/', authorizeRole(['TEACHER', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT']), getClassAttendance);
router.get('/student/:studentId', authorizeRole(['TEACHER', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT']), getStudentAttendance);

export default router;
