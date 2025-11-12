import express from 'express';
import multer from 'multer';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getPublicProducts
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

// Configure multer for file uploads
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

// Public route - no authentication required (must be before auth middleware)
router.get('/public/:storeId', getPublicProducts);

// All routes below require authentication
router.use(authenticateToken);

// Specific routes first (before dynamic routes)
router.get('/', getProducts);

// POST route for creating products
router.post('/', upload.single('image'), (req, res, next) => {
  console.log('========================================');
  console.log('POST /api/products - Route matched!');
  console.log('Request method:', req.method);
  console.log('Request path:', req.path);
  console.log('Request body keys:', Object.keys(req.body || {}));
  console.log('Request file:', req.file ? `File: ${req.file.originalname}` : 'No file');
  console.log('User:', req.user ? `ID: ${req.user.id}` : 'No user');
  console.log('========================================');
  createProduct(req, res, next);
});

// Dynamic routes last
router.get('/:id', getProductById);
router.put('/:id', upload.single('image'), updateProduct);
router.delete('/:id', deleteProduct);

export default router;

