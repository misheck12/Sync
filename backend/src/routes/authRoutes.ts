import { Router } from 'express';
import { login, register } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/register', register); // Remove in production or protect with admin middleware

export default router;
