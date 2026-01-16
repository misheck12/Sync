import { Router } from 'express';
import { handleLencoWebhook } from '../controllers/webhookController';

const router = Router();

// Define the webhook endpoint
// POST /api/webhooks/lenco
router.post('/lenco', handleLencoWebhook);

export default router;
