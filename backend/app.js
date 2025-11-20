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
import Customer from './models/customer.js';
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

  // Register health and test routes directly (not via router)
  // Test route to verify server is running
  app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running', routes: ['/api/auth', '/api/stores', '/api/products', '/api/orders', '/api/payments', '/api/health'] });
  });
  console.log('✅ Test route registered at /api/test');

  // Health check endpoint with database status
  app.get('/api/health', async (req, res) => {
    try {
      // Test database connection
      await sequelize.authenticate();
      res.json({ 
        status: 'healthy', 
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Health check failed:', error.message);
      res.status(503).json({ 
        status: 'unhealthy', 
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
  console.log('✅ Health check route registered at /api/health');

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
  console.log('✅ Debug routes endpoint registered at /api/debug/routes');

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

// Test route for store publish (to verify route exists)
app.put('/api/stores/test-publish', (req, res) => {
  console.log('✅ Test publish route hit!');
  res.json({ message: 'Test publish route works!' });
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

// Start server immediately to satisfy platform health checks, then sync DB in background
console.log(`📊 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`📊 PORT: ${process.env.PORT || 'not set'}`);

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Debug routes: http://localhost:${PORT}/api/debug/routes`);
});

// Graceful shutdown to handle platform SIGTERM/SIGINT
const shutdown = async (signal) => {
  try {
    console.log(`\n🔻 Received ${signal}. Shutting down gracefully...`);
    await new Promise((resolve) => server.close(resolve));
    console.log('🔒 HTTP server closed');
    try {
      await sequelize.close();
      console.log('🔌 Database connections closed');
    } catch (dbCloseErr) {
      console.warn('⚠️ Error closing DB connections:', dbCloseErr.message);
    }
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
  } finally {
    process.exit(0);
  }
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// After server starts, perform DB sync and schema ensures without blocking startup
(async () => {
  // Use force: false in production; alter in local dev
  const isLocalDev = !process.env.PORT || process.env.PORT === '5000';
  const useSafeSync = process.env.NODE_ENV === 'production' || !isLocalDev;
  const syncOptions = useSafeSync ? { force: false } : { alter: true };
  console.log(`📊 Sync mode: ${useSafeSync ? 'production (safe)' : 'development (alter)'}`);

  try {
    await sequelize.sync(syncOptions);
    console.log('✅ Database synced');
  } catch (syncErr) {
    console.error('❌ DB sync failed (continuing):', syncErr.message);
    return; // Skip schema ensure if sync failed
  }

  // Best-effort schema ensure; ignore permission issues in managed DBs
  try {
    console.log('🛠️ Ensuring Orders schema is up to date...');
    await sequelize.query('ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "orderNumber" VARCHAR');
    await sequelize.query('ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "customerId" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL ON UPDATE CASCADE');
    await sequelize.query('ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "paymentMethod" VARCHAR(50)');
    await sequelize.query('ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "paymentStatus" VARCHAR(50) DEFAULT \'pending\'');
    await sequelize.query('ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "paymentTransactionId" VARCHAR');
    await sequelize.query('ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "paymentReference" VARCHAR');
    await sequelize.query('ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(10,2) DEFAULT 0');
    await sequelize.query('ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "shipping" DECIMAL(10,2) DEFAULT 0');
    await sequelize.query('ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "total" DECIMAL(10,2) DEFAULT 0');
    await sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS "Orders_orderNumber_unique" ON "Orders" ("orderNumber") WHERE "orderNumber" IS NOT NULL');

    try {
      await sequelize.query('ALTER TABLE "Orders" ALTER COLUMN "totalAmount" DROP NOT NULL');
      await sequelize.query('ALTER TABLE "Orders" ALTER COLUMN "totalAmount" SET DEFAULT 0');
      await sequelize.query('UPDATE "Orders" SET "totalAmount" = COALESCE("total", 0) WHERE "totalAmount" IS NULL');
      console.log('✅ Orders.totalAmount relaxed and backfilled');
    } catch (legacyErr) {
      console.warn('⚠️ Could not adjust Orders.totalAmount column (may not exist):', legacyErr.message);
    }
    console.log('✅ Orders schema verified');
  } catch (schemaErr) {
    console.warn('⚠️ Skipping Orders schema ensure:', schemaErr.message);
  }

  try {
    console.log('🛠️ Ensuring OrderItems schema is up to date...');
    await sequelize.query('ALTER TABLE "OrderItems" ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(10,2) DEFAULT 0');
    await sequelize.query('UPDATE "OrderItems" SET "subtotal" = COALESCE("price",0) * COALESCE("quantity",0) WHERE "subtotal" IS NULL');
    console.log('✅ OrderItems schema verified');
  } catch (oiErr) {
    console.warn('⚠️ Skipping OrderItems schema ensure:', oiErr.message);
  }

  try {
    console.log('🛠️ Ensuring Products schema is up to date...');
    await sequelize.query('ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "weight" DECIMAL(10,2) DEFAULT 0');
    await sequelize.query('ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "category" VARCHAR(255)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "idx_products_category" ON "Products"("category")');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "idx_products_store_category" ON "Products"("storeId", "category")');
    console.log('✅ Products schema verified');
  } catch (prodSchemaErr) {
    console.warn('⚠️ Skipping Products schema ensure:', prodSchemaErr.message);
  }
})();
