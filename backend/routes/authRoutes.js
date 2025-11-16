import express from 'express';
import { register, login, requestPasswordReset, resetPasswordWithCode, verifyEmailWithCode, resendVerificationCode, verifyEmailLink, testEmailSend } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPasswordWithCode);
router.post('/verify-email', verifyEmailWithCode);
router.post('/resend-verification', resendVerificationCode);
router.get('/verify', verifyEmailLink);
// Diagnostic: send a test email and return provider response
router.post('/test-email', testEmailSend);

export default router;
