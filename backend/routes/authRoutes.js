import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  register, 
  login, 
  registerCustomer, 
  loginCustomer,
  verifyEmailWithCode,
  verifyEmailLink,
  resendVerificationCode,
  requestPasswordReset,
  resetPasswordWithCode,
  testEmailSend,
  verifyCustomerWithCode,
  resendCustomerVerification,
  getCurrentUser
} from '../controllers/authController.js';

const router = express.Router();

// Main Structura site authentication (for store owners)
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/verify-email', verifyEmailWithCode);
router.get('/verify', verifyEmailLink);
router.post('/resend-verification', resendVerificationCode);
router.post('/password/request-reset', requestPasswordReset);
router.post('/password/reset', resetPasswordWithCode);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPasswordWithCode);
router.post('/email/test', testEmailSend);

// Customer authentication (for published store buyers)
router.post('/customer/register', registerCustomer);
router.post('/customer/login', loginCustomer);
router.post('/customer/verify', verifyCustomerWithCode);
router.post('/customer/resend-verification', resendCustomerVerification);

export default router;
