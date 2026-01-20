import { Router } from 'express';
import {
  createForum,
  getForums,
  getForum,
  createTopic,
  getTopic,
  createPost,
  togglePostLike,
  markAsAnswer,
  toggleTopicPin,
  toggleTopicLock,
  deleteTopic,
  deletePost,
} from '../controllers/forumController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';
import { tenantHandler } from '../utils/routeTypes';
import { requireActiveSubscription } from '../middleware/subscriptionMiddleware';

const router = Router();

router.use(authenticateToken);
router.use(requireActiveSubscription);

// Forum management (Teacher/Admin)
router.post('/', authorizeRole(['TEACHER', 'SUPER_ADMIN']), tenantHandler(createForum));
router.get('/', tenantHandler(getForums));
router.get('/:forumId', tenantHandler(getForum));

// Topic management
router.post('/:forumId/topics', tenantHandler(createTopic));
router.get('/topics/:topicId', tenantHandler(getTopic));
router.post('/topics/:topicId/pin', authorizeRole(['TEACHER', 'SUPER_ADMIN']), tenantHandler(toggleTopicPin));
router.post('/topics/:topicId/lock', authorizeRole(['TEACHER', 'SUPER_ADMIN']), tenantHandler(toggleTopicLock));
router.delete('/topics/:topicId', tenantHandler(deleteTopic));

// Post management
router.post('/topics/:topicId/posts', tenantHandler(createPost));
router.post('/posts/:postId/like', tenantHandler(togglePostLike));
router.post('/posts/:postId/mark-answer', authorizeRole(['TEACHER', 'SUPER_ADMIN']), tenantHandler(markAsAnswer));
router.delete('/posts/:postId', tenantHandler(deletePost));

export default router;
