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
import superAdminRoutes from './routes/superAdminRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import apiApplicationRoutes from './routes/apiApplicationRoutes.js';
import adminSetupRoutes from './routes/adminSetupRoutes.js';
import productReviewRoutes from './routes/productReviewRoutes.js';
import storeChatRoutes from './routes/storeChatRoutes.js';
import { servePublishedStoreHTML } from './controllers/publicStoreController.js';

// Import models to ensure they are registered with Sequelize
// Import order matters to avoid circular dependencies
import User from './models/user.js';
import Customer from './models/customer.js';
import Store from './models/store.js';
import Product from './models/product.js';
import Order from './models/order.js';
import OrderItem from './models/orderItem.js';
import SupportTicket from './models/supportTicket.js';
import SupportMessage from './models/supportMessage.js';
import ApiApplication from './models/apiApplication.js';
import ProductReview from './models/productReview.js';
import StoreChat from './models/storeChat.js';

// Set up model associations after all models are loaded
Store.hasMany(Product, {
  foreignKey: 'storeId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Add uncaught exception handler to catch startup errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Error stack:', error.stack);
  // Don't exit - let server try to start anyway
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 5000;

// Register health check IMMEDIATELY (before any other setup) for Railway
// This ensures Railway can reach the endpoint even if other parts fail
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});
console.log('✅ Health check route registered at /api/health (early)');

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

  app.use('/api/admin', superAdminRoutes);
  console.log('✅ Super Admin routes registered at /api/admin');

  app.use('/api/support', supportRoutes);
  console.log('✅ Support routes registered at /api/support');

  app.use('/api/api-applications', apiApplicationRoutes);
  console.log('✅ API Application routes registered at /api/api-applications');

  app.use('/api/admin-setup', adminSetupRoutes);
  console.log('✅ Admin Setup routes registered at /api/admin-setup');

  app.use('/api', productReviewRoutes);
  console.log('✅ Product Review routes registered at /api');
  
  app.use('/api/chat', storeChatRoutes);
  console.log('✅ Store Chat routes registered at /api/chat');

  // Register test route directly (not via router)
  // Test route to verify server is running
  app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running', routes: ['/api/auth', '/api/stores', '/api/products', '/api/orders', '/api/payments', '/api/health'] });
  });
  console.log('✅ Test route registered at /api/test');

  // Debug: List all registered routes
  app.get('/api/debug/routes', (req, res) => {
    const routes = [];
    const storeRoutes = [];
    
    app._router.stack.forEach(function(middleware) {
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
console.log(`📊 RAILWAY_ENVIRONMENT: ${process.env.RAILWAY_ENVIRONMENT || 'not set'}`);

// Start server - listen on all interfaces (0.0.0.0) for Railway/cloud deployment
// Wrap in try-catch to ensure errors are logged
let server;
try {
  console.log(`🔄 Attempting to start server on port ${PORT}...`);
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server successfully started!`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Test endpoint: http://0.0.0.0:${PORT}/api/test`);
    console.log(`❤️  Health check: http://0.0.0.0:${PORT}/api/health`);
    console.log(`🔍 Debug routes: http://0.0.0.0:${PORT}/api/debug/routes`);
  });
  
  // Handle server errors
  server.on('error', (error) => {
    console.error('❌ Server error event:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
      process.exit(1);
    }
  });
  
  console.log('✅ Server listen() call completed');
} catch (error) {
  console.error('❌ Failed to start server:', error);
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  process.exit(1);
}

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
    await sequelize.query('ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "paymentReceipt" VARCHAR');
    await sequelize.query('ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "verificationNotes" TEXT');
    await sequelize.query('ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "cancellationRequest" VARCHAR(50) DEFAULT \'none\'');
    await sequelize.query('ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT');
    
    // Create ProductReviews table if not exists
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "ProductReviews" (
          id SERIAL PRIMARY KEY,
          "productId" INTEGER NOT NULL REFERENCES "Products"(id) ON DELETE CASCADE ON UPDATE CASCADE,
          "customerId" INTEGER NOT NULL REFERENCES "Customers"(id) ON DELETE CASCADE ON UPDATE CASCADE,
          "orderId" INTEGER REFERENCES "Orders"(id) ON DELETE SET NULL ON UPDATE CASCADE,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          images JSON DEFAULT '[]',
          "isVerifiedPurchase" BOOLEAN DEFAULT false,
          "isVisible" BOOLEAN DEFAULT true,
          "helpfulCount" INTEGER DEFAULT 0,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ ProductReviews table ensured');
    } catch (reviewErr) {
      console.warn('⚠️ Skipping ProductReviews table ensure:', reviewErr.message);
    }
    
    // Update Users.role to ENUM if not already
    try {
      await sequelize.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Users_role') THEN
            CREATE TYPE "enum_Users_role" AS ENUM('user', 'admin', 'super_admin');
          END IF;
        END $$;
      `);
      await sequelize.query('ALTER TABLE "Users" ALTER COLUMN "role" TYPE "enum_Users_role" USING "role"::"enum_Users_role"');
    } catch (e) {
      console.log('Role enum update skipped or already exists:', e.message);
    }
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
    console.log('🛠️ Ensuring Users verification schema is up to date...');
    await sequelize.query('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT false');
    await sequelize.query('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP WITH TIME ZONE');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "EmailVerificationTokens" (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(20) NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await sequelize.query('CREATE INDEX IF NOT EXISTS "idx_email_verification_email" ON "EmailVerificationTokens"(email)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "idx_email_verification_expires" ON "EmailVerificationTokens"("expiresAt")');
    console.log('✅ Users verification schema verified');
  } catch (userSchemaErr) {
    console.warn('⚠️ Skipping Users verification schema ensure:', userSchemaErr.message);
  }

  try {
    console.log('🛠️ Ensuring Customers verification schema is up to date...');
    await sequelize.query('ALTER TABLE "Customers" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT false');
    await sequelize.query('ALTER TABLE "Customers" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP WITH TIME ZONE');
    // Add address fields for existing customers (optional fields)
    await sequelize.query('ALTER TABLE "Customers" ADD COLUMN IF NOT EXISTS "region" VARCHAR(255)');
    await sequelize.query('ALTER TABLE "Customers" ADD COLUMN IF NOT EXISTS "province" VARCHAR(255)');
    await sequelize.query('ALTER TABLE "Customers" ADD COLUMN IF NOT EXISTS "municipality" VARCHAR(255)');
    await sequelize.query('ALTER TABLE "Customers" ADD COLUMN IF NOT EXISTS "barangay" VARCHAR(255)');
    await sequelize.query('ALTER TABLE "Customers" ADD COLUMN IF NOT EXISTS "houseNumber" VARCHAR(255)');
    await sequelize.query('ALTER TABLE "Customers" ADD COLUMN IF NOT EXISTS "street" VARCHAR(255)');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "CustomerVerificationTokens" (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(20) NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await sequelize.query('CREATE INDEX IF NOT EXISTS "idx_customer_verification_email" ON "CustomerVerificationTokens"(email)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "idx_customer_verification_expires" ON "CustomerVerificationTokens"("expiresAt")');
    console.log('✅ Customers verification and address schema verified');
  } catch (customerSchemaErr) {
    console.warn('⚠️ Skipping Customers verification schema ensure:', customerSchemaErr.message);
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

  try {
    console.log('🛠️ Ensuring StoreChats table is up to date...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "StoreChats" (
        id SERIAL PRIMARY KEY,
        "storeId" INTEGER NOT NULL REFERENCES "Stores"(id) ON DELETE CASCADE ON UPDATE CASCADE,
        "customerId" INTEGER NOT NULL REFERENCES "Customers"(id) ON DELETE CASCADE ON UPDATE CASCADE,
        "senderType" VARCHAR(255) NOT NULL CHECK ("senderType" IN ('customer', 'store_owner')),
        "senderId" INTEGER NOT NULL,
        message TEXT NOT NULL,
        "isRead" BOOLEAN DEFAULT FALSE,
        "productId" INTEGER REFERENCES "Products"(id) ON DELETE SET NULL ON UPDATE CASCADE,
        "orderId" INTEGER REFERENCES "Orders"(id) ON DELETE SET NULL ON UPDATE CASCADE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);
    await sequelize.query('CREATE INDEX IF NOT EXISTS "idx_storechats_store_customer" ON "StoreChats"("storeId", "customerId")');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "idx_storechats_store_unread" ON "StoreChats"("storeId", "isRead")');
    console.log('✅ StoreChats table ensured');
  } catch (chatErr) {
    console.warn('⚠️ Skipping StoreChats table ensure:', chatErr.message);
  }
})();
