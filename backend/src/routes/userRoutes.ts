import { Router } from 'express';
import { getTeachers, getUsers, createUser, updateUser, toggleUserStatus } from '../controllers/userController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/teachers', getTeachers);

// User Management Routes (Super Admin only)
router.get('/', authorizeRole(['SUPER_ADMIN']), getUsers);
router.post('/', authorizeRole(['SUPER_ADMIN']), createUser);
router.put('/:id', authorizeRole(['SUPER_ADMIN']), updateUser);
router.patch('/:id/status', authorizeRole(['SUPER_ADMIN']), toggleUserStatus);

export default router;
