import express from 'express';
import { register, login, requestPasswordReset, resetPasswordWithCode, verifyEmailWithCode } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPasswordWithCode);
router.post('/verify-email', verifyEmailWithCode);

export default router;
