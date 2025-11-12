// Vercel serverless function entry point
// This file handles all API routes for Vercel deployment

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Log startup to help debug
console.log('API function starting...');
console.log('Environment check:', {
  hasDbUrl: !!process.env.DATABASE_URL,
  hasSupabaseUrl: !!process.env.SUPABASE_DB_URL,
  hasJwtSecret: !!process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV
});

let authRoutes, storeRoutes, productRoutes, orderRoutes, paymentRoutes;
let servePublishedStoreHTML;
let User, Store, Product, Order, OrderItem;

try {
  // Import routes with error handling
  const authModule = await import('../backend/routes/authRoutes.js');
  authRoutes = authModule.default;
  
  const storeModule = await import('../backend/routes/storeRoutes.js');
  storeRoutes = storeModule.default;
  
  const productModule = await import('../backend/routes/productRoutes.js');
  productRoutes = productModule.default;
  
  const orderModule = await import('../backend/routes/orderRoutes.js');
  orderRoutes = orderModule.default;
  
  const paymentModule = await import('../backend/routes/paymentRoutes.js');
  paymentRoutes = paymentModule.default;
  
  const publicStoreModule = await import('../backend/controllers/publicStoreController.js');
  servePublishedStoreHTML = publicStoreModule.servePublishedStoreHTML;

  // Import models
  const UserModule = await import('../backend/models/user.js');
  User = UserModule.default;
  
  const StoreModule = await import('../backend/models/store.js');
  Store = StoreModule.default;
  
  const ProductModule = await import('../backend/models/product.js');
  Product = ProductModule.default;
  
  const OrderModule = await import('../backend/models/order.js');
  Order = OrderModule.default;
  
  const OrderItemModule = await import('../backend/models/orderItem.js');
  OrderItem = OrderItemModule.default;

  // Set up model associations
  Store.hasMany(Product, {
    foreignKey: 'storeId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  
  console.log('All modules imported successfully');
} catch (error) {
  console.error('Error importing modules:', error);
  console.error('Error stack:', error.stack);
}

const app = express();

// CORS configuration - Allow all Vercel domains
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all Vercel domains (production and preview deployments)
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    // Allow localhost for development
    if (origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Log rejected origins for debugging
    console.log('CORS rejected origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Body parser with increased limits for file uploads
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from Supabase Storage (via public URLs)
// Note: In production, files are served from Supabase Storage, not local filesystem

// Standalone store pages
if (servePublishedStoreHTML) {
  app.get('/store/:domain', servePublishedStoreHTML);
}

// API Routes
if (authRoutes) app.use('/api/auth', authRoutes);
if (storeRoutes) app.use('/api/stores', storeRoutes);
if (productRoutes) app.use('/api/products', productRoutes);
if (orderRoutes) app.use('/api/orders', orderRoutes);
if (paymentRoutes) app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test database connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    // Lazy import to avoid loading at module level
    const dbModule = await import('../backend/config/db.js');
    const sequelize = dbModule.default;
    await sequelize.authenticate();
    res.json({ 
      status: 'success', 
      message: 'Database connection successful',
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        hasSupabaseUrl: !!process.env.SUPABASE_DB_URL,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error.message,
      stack: error.stack,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        hasSupabaseUrl: !!process.env.SUPABASE_DB_URL,
        nodeEnv: process.env.NODE_ENV,
        dbUrlLength: process.env.DATABASE_URL?.length || 0,
        supabaseUrlLength: process.env.SUPABASE_DB_URL?.length || 0
      }
    });
  }
});

// 404 handler (must be after all routes)
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found', 
    method: req.method, 
    path: req.path 
  });
});

// Error handler (must be last)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Error Stack:', err.stack);
  console.error('Request Path:', req.path);
  console.error('Request Method:', req.method);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    // Show stack trace and details for debugging (remove in production later)
    stack: err.stack,
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && { 
      fullError: err.toString()
    })
  });
});

// Export for Vercel serverless
export default async function handler(req, res) {
  try {
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      error: 'Function handler error',
      message: error.message,
      stack: error.stack
    });
  }
}

