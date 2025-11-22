import express from 'express';
import {
  createApplication,
  getMyApplications,
  getAllApplications,
  getApplication,
  reviewApplication,
  uploadDocuments,
  checkStoreQrApiStatus
} from '../controllers/apiApplicationController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/checkRole.js';

const router = express.Router();

// Public route - check store QR API status (no auth required)
router.get('/stores/:storeId/qr-api-status', checkStoreQrApiStatus);

// All other routes require authentication
router.use(authenticateToken);

// Store owner routes
router.post('/applications', uploadDocuments.fields([
  { name: 'birDocument', maxCount: 1 },
  { name: 'businessPermit', maxCount: 1 },
  { name: 'validId', maxCount: 1 },
  { name: 'otherDocuments', maxCount: 10 }
]), createApplication);
router.get('/applications/my', getMyApplications);
router.get('/applications/my/:id', getApplication);

// Super admin routes
router.get('/applications', requireSuperAdmin, getAllApplications);
router.get('/applications/:id', getApplication);
router.put('/applications/:id/review', requireSuperAdmin, reviewApplication);

export default router;

