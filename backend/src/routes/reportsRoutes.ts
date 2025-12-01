import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';
import {
  getDebtorsList,
  getDailyCollectionReport,
  getFeeCollectionSummary,
  getAttendanceSummary,
  getStudentAttendanceHistory,
  getAbsenteeismReport,
  getClassRoster,
  getEnrollmentStats
} from '../controllers/reportsController';

const router = Router();

router.use(authenticateToken);

// Financial Reports - Bursar and Admin
router.get('/financial/debtors', authorizeRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT']), getDebtorsList);
router.get('/financial/daily-collection', authorizeRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT']), getDailyCollectionReport);
router.get('/financial/fee-summary', authorizeRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT']), getFeeCollectionSummary);

// Attendance Reports - Admin, Teachers
router.get('/attendance/summary', authorizeRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']), getAttendanceSummary);
router.get('/attendance/student', authorizeRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']), getStudentAttendanceHistory);
router.get('/attendance/absenteeism', authorizeRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']), getAbsenteeismReport);

// Student Reports - All staff
router.get('/students/roster', authorizeRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT']), getClassRoster);
router.get('/students/enrollment', authorizeRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT']), getEnrollmentStats);

export default router;
