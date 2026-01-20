import { Router } from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncement,
  markAsRead,
  getAnnouncementStats,
  updateAnnouncement,
  deleteAnnouncement,
  getUnreadCount,
} from '../controllers/announcementController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';
import { tenantHandler } from '../utils/routeTypes';
import { requireActiveSubscription } from '../middleware/subscriptionMiddleware';

const router = Router();

router.use(authenticateToken);
router.use(requireActiveSubscription);

// Announcement management (Admin/Teacher)
router.post('/', authorizeRole(['TEACHER', 'SUPER_ADMIN', 'SECRETARY']), tenantHandler(createAnnouncement));
router.get('/', tenantHandler(getAnnouncements));
router.get('/unread-count', tenantHandler(getUnreadCount));
router.get('/:announcementId', tenantHandler(getAnnouncement));
router.get('/:announcementId/stats', authorizeRole(['TEACHER', 'SUPER_ADMIN', 'SECRETARY']), tenantHandler(getAnnouncementStats));
router.put('/:announcementId', authorizeRole(['TEACHER', 'SUPER_ADMIN', 'SECRETARY']), tenantHandler(updateAnnouncement));
router.delete('/:announcementId', authorizeRole(['TEACHER', 'SUPER_ADMIN', 'SECRETARY']), tenantHandler(deleteAnnouncement));

// Mark as read (All users)
router.post('/:announcementId/read', tenantHandler(markAsRead));

export default router;
