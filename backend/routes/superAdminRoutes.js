import express from 'express';
import {
  getAllStores,
  getStoreStatistics,
  updateStoreStatus,
  getStoreDetails,
  deleteStore
} from '../controllers/superAdminController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/checkRole.js';

const router = express.Router();

// All routes require authentication and super admin role
router.use(authenticateToken);
router.use(requireSuperAdmin);

router.get('/stores', getAllStores);
router.get('/statistics', getStoreStatistics);
router.get('/stores/:id', getStoreDetails);
router.put('/stores/:id/status', updateStoreStatus);
router.delete('/stores/:id', deleteStore);

export default router;

