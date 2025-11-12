import express from 'express';
import {
  processGCashPayment,
  processPayPalPayment,
  verifyPayPalPayment,
  processCardPayment
} from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public route for PayPal webhook (no auth required)
router.post('/paypal/verify', verifyPayPalPayment);

// All routes below require authentication
router.use(authenticateToken);

router.post('/gcash', processGCashPayment);
router.post('/paypal', processPayPalPayment);
router.post('/card', processCardPayment);

export default router;

