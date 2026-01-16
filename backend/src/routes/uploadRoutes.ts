import { Router } from 'express';
import { upload, uploadFile } from '../controllers/uploadController';
import { authenticateToken } from '../middleware/authMiddleware';
import { handleControllerError } from '../utils/tenantContext';

const router = Router();

router.post('/', authenticateToken, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File too large. Max 5MB' });
            }
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, uploadFile);

export default router;
