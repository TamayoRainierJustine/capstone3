import express from 'express';
import {
  getProductReviews,
  createProductReview,
  updateProductReview,
  deleteProductReview
} from '../controllers/productReviewController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public route - get reviews for a product
router.get('/products/:productId/reviews', getProductReviews);

// Protected routes - require authentication
router.post('/products/:productId/reviews', authenticateToken, createProductReview);
router.put('/reviews/:id', authenticateToken, updateProductReview);
router.delete('/reviews/:id', authenticateToken, deleteProductReview);

export default router;
