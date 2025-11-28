import express from 'express';
import multer from 'multer';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getPublicProducts,
  getPublicCategories,
  getCategories
} from '../controllers/productController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

console.log('========================================');
console.log('✅ Product routes module loaded successfully');
console.log('Router type:', typeof router);
console.log('Router methods:', Object.keys(router));
console.log('========================================');

// Add a middleware to log all requests to product routes
router.use((req, res, next) => {
  console.log(`📦 Product route hit: ${req.method} ${req.path}`);
  console.log(`   Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
  console.log(`   Base URL: ${req.baseUrl}`);
  console.log(`   Original URL: ${req.originalUrl}`);
  next();
});

// Configure multer for file uploads (images and 3D models)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit (for 3D models)
  },
  fileFilter: (req, file, cb) => {
    // Allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    }
    // Allow 3D model files (GLB/GLTF)
    else if (
      file.mimetype === 'model/gltf-binary' ||
      file.mimetype === 'model/gltf+json' ||
      file.originalname.toLowerCase().endsWith('.glb') ||
      file.originalname.toLowerCase().endsWith('.gltf')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG) and 3D model files (GLB, GLTF) are allowed'), false);
    }
  }
});

// Public routes - no authentication required (must be before auth middleware)
router.get('/public/:storeId', getPublicProducts);
router.get('/public/:storeId/categories', getPublicCategories);

// All routes below require authentication
router.use(authenticateToken);

// Specific routes first (before dynamic routes)
router.get('/', getProducts);
router.get('/categories/list', getCategories);

// POST route for creating products
router.post('/', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'model3d', maxCount: 1 }
]), (req, res, next) => {
  console.log('========================================');
  console.log('POST /api/products - Route matched!');
  console.log('Request method:', req.method);
  console.log('Request path:', req.path);
  console.log('Request body keys:', Object.keys(req.body || {}));
  console.log('Request files:', req.files ? JSON.stringify(Object.keys(req.files)) : 'No files');
  console.log('User:', req.user ? `ID: ${req.user.id}` : 'No user');
  console.log('========================================');
  createProduct(req, res, next);
});

// Dynamic routes last
router.get('/:id', getProductById);
router.put('/:id', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'model3d', maxCount: 1 }
]), updateProduct);
router.delete('/:id', deleteProduct);

export default router;

