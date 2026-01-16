import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';
import { tenantHandler, publicHandler } from '../utils/routeTypes';
import {
    getPlans,
    getSubscriptionStatus,
    getPaymentHistory,
    initiateUpgrade,
    payWithMobileMoney,
    submitPaymentProof,
    confirmPayment,
    cancelSubscription,
    downloadInvoice
} from '../controllers/subscriptionController';

const router = Router();

// Public routes (no auth required)
router.get('/plans', publicHandler(getPlans));

// Protected routes (require authentication)
router.get('/status', authenticateToken, tenantHandler(getSubscriptionStatus));
router.get('/payments', authenticateToken, tenantHandler(getPaymentHistory));
router.post('/upgrade', authenticateToken, authorizeRole(['SUPER_ADMIN']), tenantHandler(initiateUpgrade));
router.post('/pay-mobile-money', authenticateToken, authorizeRole(['SUPER_ADMIN']), tenantHandler(payWithMobileMoney));
router.post('/cancel', authenticateToken, authorizeRole(['SUPER_ADMIN']), tenantHandler(cancelSubscription));
router.post('/payments/:paymentId/submit-proof', authenticateToken, authorizeRole(['SUPER_ADMIN']), tenantHandler(submitPaymentProof));
router.get('/payments/:paymentId/invoice', authenticateToken, authorizeRole(['SUPER_ADMIN']), tenantHandler(downloadInvoice));

// Admin only routes
router.post('/payments/:paymentId/confirm', authenticateToken, authorizeRole(['SUPER_ADMIN']), tenantHandler(confirmPayment));

export default router;
