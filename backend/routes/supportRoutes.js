import express from 'express';
import {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicket,
  addMessage,
  updateTicketStatus
} from '../controllers/supportTicketController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/checkRole.js';

const router = express.Router();

// Public routes - none (all require auth)

// All routes require authentication
router.use(authenticateToken);

// Store owner routes
router.post('/tickets', createTicket);
router.get('/tickets/my', getMyTickets);
router.get('/tickets/:id', getTicket);
router.post('/tickets/:id/messages', addMessage);

// Super admin routes
router.get('/tickets', getAllTickets);
router.put('/tickets/:id/status', requireSuperAdmin, updateTicketStatus);

export default router;

