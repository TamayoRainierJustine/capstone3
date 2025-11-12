import express from 'express';
import { 
  createStore, 
  getUserStores, 
  getStoreById, 
  updateStore,
  saveStoreContent,
  publishStore,
  getPublishedStoreByDomain,
  uploadBackgroundImage,
  uploadBackground,
  deleteStore
} from '../controllers/storeController.js';
import { servePublishedStoreHTML } from '../controllers/publicStoreController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Debug middleware to log all store route requests
router.use((req, res, next) => {
  console.log(`🏪 Store route hit: ${req.method} ${req.path}`);
  console.log(`   Full URL: ${req.originalUrl}`);
  next();
});

// Public routes - no authentication required
// API endpoint for fetching store data (used by React frontend)
router.get('/public/:domain', getPublishedStoreByDomain);

// Standalone HTML page endpoint (works even if frontend is down)
// Access via: http://localhost:5000/store/:domain
router.get('/store/:domain', servePublishedStoreHTML);

// All routes below require authentication
router.use(authenticateToken);

// Create a new store
router.post('/', createStore);

// Get all stores for the authenticated user
router.get('/', getUserStores);

// More specific routes FIRST (before the general :id route)
// Upload background image (authenticated via router.use above)
router.post('/background/upload', (req, res, next) => {
  console.log('🖼️ Background upload route hit!');
  console.log('   Method:', req.method);
  console.log('   Path:', req.path);
  console.log('   Original URL:', req.originalUrl);
  next();
}, uploadBackground.single('image'), uploadBackgroundImage);

// Save store content
router.put('/:id/content', saveStoreContent);

// Publish/unpublish store - with explicit logging
router.put('/:id/publish', (req, res, next) => {
  console.log('🔔 PUT /:id/publish route matched!');
  console.log('   Params:', req.params);
  console.log('   Body:', req.body);
  publishStore(req, res, next);
});

// Get a specific store by ID
router.get('/:id', getStoreById);

// Update a store
router.put('/:id', updateStore);

// Delete a store
router.delete('/:id', deleteStore);

export default router; 