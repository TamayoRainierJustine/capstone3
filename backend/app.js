import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { servePublishedStoreHTML } from './controllers/publicStoreController.js';

// Import models to ensure they are registered with Sequelize
// Import order matters to avoid circular dependencies
import User from './models/user.js';
import Store from './models/store.js';
import Product from './models/product.js';
import Order from './models/order.js';
import OrderItem from './models/orderItem.js';

// Set up model associations after all models are loaded
Store.hasMany(Product, {
  foreignKey: 'storeId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
// Increase body size limit to handle base64-encoded images (50MB for safety)
// Base64 encoding increases size by ~33%, so a 5MB image becomes ~6.7MB
// Setting to 50MB to handle multiple images or larger files
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Debug middleware to log all incoming requests
app.use((req, res, next) => {
  if (req.path.startsWith('/api/products') || req.path.startsWith('/api/stores')) {
    console.log(`🔍 Incoming request: ${req.method} ${req.path}`);
    console.log(`   Original URL: ${req.originalUrl}`);
    console.log(`   Base URL: ${req.baseUrl}`);
  }
  next();
});

// Serve static files for product images and backgrounds
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Standalone store pages - accessible even if frontend is down
// Access via: http://localhost:5000/store/:domain
// This allows stores to be viewed even when the React frontend is offline
// Place this BEFORE API routes to ensure it's matched first
app.get('/store/:domain', servePublishedStoreHTML);

// Routes - MUST be registered before server starts listening
console.log('========================================');
console.log('Registering routes...');
console.log('========================================');

try {
  console.log('productRoutes loaded:', !!productRoutes);
  console.log('productRoutes type:', typeof productRoutes);
  console.log('productRoutes constructor:', productRoutes?.constructor?.name);

  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes registered at /api/auth');

  app.use('/api/stores', storeRoutes);
  console.log('✅ Store routes registered at /api/stores');

  if (productRoutes && typeof productRoutes === 'function') {
    app.use('/api/products', productRoutes);
    console.log('✅ Product routes registered at /api/products');
    console.log('   Router instance:', productRoutes.constructor.name);
  } else {
    console.error('❌ productRoutes is not a valid router!');
    console.error('   Type:', typeof productRoutes);
    console.error('   Value:', productRoutes);
    throw new Error('Failed to register product routes - router is invalid');
  }

  app.use('/api/orders', orderRoutes);
  console.log('✅ Order routes registered at /api/orders');

  app.use('/api/payments', paymentRoutes);
  console.log('✅ Payment routes registered at /api/payments');

  console.log('========================================');
  console.log('✅ All routes registered successfully!');
  console.log('========================================');
} catch (error) {
  console.error('========================================');
  console.error('❌ ERROR registering routes:', error);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  console.error('========================================');
  // Don't throw - let server start anyway to see other errors
}

// Test route to verify server is running
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running', routes: ['/api/auth', '/api/stores', '/api/products', '/api/orders', '/api/payments'] });
});

// Test route for store publish (to verify route exists)
app.put('/api/stores/test-publish', (req, res) => {
  console.log('✅ Test publish route hit!');
  res.json({ message: 'Test publish route works!' });
});

// Debug: List all registered routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  const storeRoutes = [];
  
  app._router.stack.forEach(function(middleware){
    if(middleware.route){
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if(middleware.name === 'router'){
      // This is a mounted router
      const basePath = middleware.regexp.toString().replace(/^\^\\\//, '').replace(/\\\/\?\?\$/, '').replace(/\\/g, '').replace(/\$/g, '');
      console.log('Router base path:', basePath);
      
      middleware.handle.stack.forEach(function(handler){
        if(handler.route){
          const fullPath = basePath + handler.route.path;
          routes.push({
            path: fullPath,
            methods: Object.keys(handler.route.methods)
          });
          if (basePath.includes('stores')) {
            storeRoutes.push({
              path: handler.route.path,
              methods: Object.keys(handler.route.methods),
              fullPath: fullPath
            });
          }
        } else if(handler.name === 'router'){
          // Nested router
          const nestedPath = handler.regexp.toString().replace(/^\^\\\//, '').replace(/\\\/\?\?\$/, '').replace(/\\/g, '');
          handler.handle.stack.forEach(function(nestedHandler){
            if(nestedHandler.route){
              routes.push({
                path: basePath + nestedPath + nestedHandler.route.path,
                methods: Object.keys(nestedHandler.route.methods)
              });
            }
          });
        }
      });
    }
  });
  
  res.json({ 
    routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
    storeRoutes: storeRoutes.sort((a, b) => a.path.localeCompare(b.path)),
    totalRoutes: routes.length,
    productRoutesRegistered: !!productRoutes
  });
});

// 404 handler - must be after all routes but before server starts
app.use((req, res) => {
  console.log('========================================');
  console.log(`❌ 404 HANDLER - ${req.method} ${req.path}`);
  console.log(`   Original URL: ${req.originalUrl}`);
  console.log(`   Base URL: ${req.baseUrl}`);
  console.log(`   Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
  console.log(`   Headers:`, req.headers);
  console.log('========================================');
  res.status(404).json({ 
    error: 'Route not found', 
    method: req.method, 
    path: req.path,
    originalUrl: req.originalUrl,
    message: `Cannot ${req.method} ${req.path}` 
  });
}); 

// Test DB connection & sync
sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ Database synced');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Test endpoint: http://localhost:${PORT}/api/test`);
      console.log(`🔍 Debug routes: http://localhost:${PORT}/api/debug/routes`);
      console.log(`📦 Test products: POST http://localhost:${PORT}/api/products/test`);
    });
  })
  .catch((err) => {
    console.error('❌ DB connection failed:', err);
    // Still start server even if DB fails for testing
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (DB connection failed)`);
      console.log(`📝 Test endpoint: http://localhost:${PORT}/api/test`);
      console.log(`🔍 Debug routes: http://localhost:${PORT}/api/debug/routes`);
    });
  });
