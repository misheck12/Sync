import { Router } from 'express';
import { getClasses, createClass, updateClass, deleteClass, getClassStudents, addStudentsToClass } from '../controllers/classController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getClasses);
router.post('/', authorizeRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), createClass);
router.put('/:id', authorizeRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), updateClass);
router.delete('/:id', authorizeRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), deleteClass);
router.get('/:id/students', getClassStudents);
router.post('/:id/students', authorizeRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), addStudentsToClass);

export default router;
