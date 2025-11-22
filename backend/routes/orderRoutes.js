import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
  getSalesAnalytics,
  deleteOrder,
  getCustomerOrders,
  requestOrderCancellation,
  handleCancellationRequest
} from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for payment receipt uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Public routes - no authentication required
router.post('/', upload.single('paymentReceipt'), createOrder);
router.get('/customer', getCustomerOrders); // GET /api/orders/customer?email=...
router.post('/cancel', requestOrderCancellation); // POST /api/orders/cancel (public for customers)

// All routes below require authentication
router.use(authenticateToken);

router.get('/', getOrders);
router.get('/analytics', getSalesAnalytics);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/payment', updatePaymentStatus);
router.put('/:id/cancellation', handleCancellationRequest); // PUT /api/orders/:id/cancellation (store owner)
router.delete('/:id', deleteOrder);

export default router;

