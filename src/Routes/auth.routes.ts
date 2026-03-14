import { Router } from 'express';
import { register, login, verifyEmail, refresh, verifyToken, forgotPassword, resetPassword } from '../Controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/refresh', refresh);
router.get('/verify-token', verifyToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
export default router;
