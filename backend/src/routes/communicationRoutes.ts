import { Router } from 'express';
import { sendAnnouncement, getMyNotifications, markAsRead, markAllAsRead } from '../controllers/communicationController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

// User routes
router.get('/notifications', getMyNotifications);
router.patch('/notifications/:id/read', markAsRead);
router.patch('/notifications/read-all', markAllAsRead);

// Admin routes
router.post('/announcements', authorizeRole(['SUPER_ADMIN']), sendAnnouncement);

export default router;
