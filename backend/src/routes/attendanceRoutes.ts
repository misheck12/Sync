import { Router } from 'express';
import { recordAttendance, getClassAttendance, getStudentAttendance, getAttendanceAnalytics } from '../controllers/attendanceController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/', authorizeRole(['TEACHER', 'SUPER_ADMIN', 'SECRETARY']), recordAttendance);
router.get('/', authorizeRole(['TEACHER', 'SUPER_ADMIN', 'BURSAR', 'SECRETARY']), getClassAttendance);
router.get('/analytics', authorizeRole(['TEACHER', 'SUPER_ADMIN', 'SECRETARY']), getAttendanceAnalytics);
router.get('/student/:studentId', authorizeRole(['TEACHER', 'SUPER_ADMIN', 'BURSAR', 'SECRETARY']), getStudentAttendance);

export default router;
