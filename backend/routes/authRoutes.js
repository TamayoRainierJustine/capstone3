import express from 'express';
import { register, login, requestPasswordReset, resetPasswordWithCode, verifyEmailWithCode, resendVerificationCode } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPasswordWithCode);
router.post('/verify-email', verifyEmailWithCode);
router.post('/resend-verification', resendVerificationCode);

export default router;
