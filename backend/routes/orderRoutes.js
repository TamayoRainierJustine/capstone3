import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
  getSalesAnalytics,
  deleteOrder
} from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public route - no authentication required (for creating orders from published stores)
router.post('/', createOrder);

// All routes below require authentication
router.use(authenticateToken);

router.get('/', getOrders);
router.get('/analytics', getSalesAnalytics);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/payment', updatePaymentStatus);
router.delete('/:id', deleteOrder);

export default router;

