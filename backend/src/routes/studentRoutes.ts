import { Router } from 'express';
import { getStudents, createStudent, getStudentById, updateStudent, deleteStudent, getMyChildren } from '../controllers/studentController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/my-children', authorizeRole(['PARENT']), getMyChildren);
router.get('/', getStudents);
router.get('/:id', getStudentById);
router.post('/', authorizeRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), createStudent);
router.put('/:id', authorizeRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), updateStudent);
router.delete('/:id', authorizeRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), deleteStudent);

export default router;
