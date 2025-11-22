import express from 'express';
import {
  getStoreConversations,
  getCustomerMessages,
  sendStoreMessage,
  getCustomerConversations,
  sendCustomerMessage,
  getStoreUnreadCount
} from '../controllers/storeChatController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Store owner routes (require authentication)
router.get('/store/conversations', authenticateToken, getStoreConversations);
router.get('/store/conversations/:customerId/messages', authenticateToken, getCustomerMessages);
router.post('/store/messages', authenticateToken, sendStoreMessage);
router.get('/store/unread-count', authenticateToken, getStoreUnreadCount);

// Customer routes (require customer authentication)
router.get('/customer/stores/:storeId/conversations', authenticateToken, getCustomerConversations);
router.post('/customer/messages', authenticateToken, sendCustomerMessage);

export default router;

