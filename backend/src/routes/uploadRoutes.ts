import { Router } from 'express';
import { uploadFile, uploadFiles, deleteFile, upload } from '../controllers/uploadController';
import { authenticateToken } from '../middleware/authMiddleware';
import { tenantHandler } from '../utils/routeTypes';
import { requireActiveSubscription } from '../middleware/subscriptionMiddleware';

const router = Router();

router.use(authenticateToken);
router.use(requireActiveSubscription);

// Single file upload
router.post('/file', upload.single('file'), tenantHandler(uploadFile));

// Multiple files upload
router.post('/files', upload.array('files', 10), tenantHandler(uploadFiles));

// Delete file
router.delete('/file/:filename', tenantHandler(deleteFile));

export default router;
