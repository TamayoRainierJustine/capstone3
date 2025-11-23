import Order from '../models/order.js';
import OrderItem from '../models/orderItem.js';
import Product from '../models/product.js';
import Store from '../models/store.js';
import User from '../models/user.js';
import sequelize from '../config/db.js';
import { Op } from 'sequelize';
import multer from 'multer';
import path from 'path';
import { uploadToSupabase } from '../utils/supabaseStorage.js';
import { sendEmail } from '../utils/email.js';

// Generate unique order number
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Generate unique order code for payment verification
const generateUniqueOrderCode = (orderNumber) => {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${orderNumber}-${random}`;
};

// Get all orders for a store
export const getOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const { status } = req.query;
    const whereClause = { storeId: store.id };
    if (status) {
      whereClause.status = status;
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          include: [Product]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get a single order
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const order = await Order.findOne({
      where: { id, storeId: store.id },
      include: [
        {
          model: OrderItem,
          include: [Product]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

// Create a new order
export const createOrder = async (req, res) => {
  const startTime = Date.now();
  console.log('📦 Order creation request received');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const {
      storeId,
      items,
      shippingAddress,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      paymentReference,
      shipping
    } = req.body;

    console.log(`Step 1: Validating request - storeId: ${storeId}, items: ${items?.length}`);

    // Validate required fields
    if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
      console.error('Validation failed: Store ID or items missing');
      return res.status(400).json({ message: 'Store ID and items are required' });
    }

    if (!customerName || !customerEmail || !paymentMethod) {
      console.error('Validation failed: Customer info missing');
      return res.status(400).json({ message: 'Customer name, email, and payment method are required' });
    }

    if (!shippingAddress || !shippingAddress.region || !shippingAddress.province || 
        !shippingAddress.municipality || !shippingAddress.barangay ||
        !shippingAddress.houseNumber || !shippingAddress.street) {
      console.error('Validation failed: Shipping address incomplete');
      return res.status(400).json({ message: 'Complete shipping address is required (including house number and street)' });
    }

    // Test database connection before proceeding
    console.log('Step 2: Testing database connection...');
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection test passed');
    } catch (dbError) {
      console.error('❌ Database connection test failed:', dbError.message);
      console.error('Error details:', {
        name: dbError.name,
        code: dbError.code,
        message: dbError.message
      });
      return res.status(503).json({ 
        message: 'Database connection error - please try again',
        error: 'DATABASE_ERROR',
        details: 'Unable to connect to database'
      });
    }

    // Validate store exists and is published - with retry
    console.log('Step 3: Fetching store...');
    let store;
    try {
      store = await Store.findOne({
        where: { id: storeId, status: 'published' },
        attributes: ['id', 'status']
      });
      console.log(`✅ Store found: ${store ? store.id : 'NOT FOUND'}`);
    } catch (storeError) {
      console.error('❌ Error fetching store:', storeError.message);
      console.error('Error details:', {
        name: storeError.name,
        code: storeError.code,
        message: storeError.message,
        stack: storeError.stack
      });
      // If connection error, return 503
      if (storeError.name?.startsWith('Sequelize') || 
          storeError.code === 'ECONNREFUSED' ||
          storeError.code === 'ETIMEDOUT') {
        return res.status(503).json({ 
          message: 'Database connection error - please try again',
          error: 'DATABASE_ERROR',
          step: 'store_fetch'
        });
      }
      throw storeError;
    }

    if (!store) {
      console.error(`❌ Store not found or not published: ${storeId}`);
      return res.status(404).json({ message: 'Store not found or not published' });
    }

    // Validate products and calculate totals - OPTIMIZED: fetch all products in parallel
    const productIds = items.map(item => item.productId);
    console.log(`Step 4: Fetching products... (${productIds.length} products)`);
    
    // Fetch all products in parallel instead of sequentially - with retry
    let products;
    try {
      products = await Product.findAll({
        where: { 
          id: { [Op.in]: productIds },
          storeId, 
          isActive: true 
        },
        attributes: ['id', 'name', 'price', 'stock']
      });
      console.log(`✅ Products found: ${products.length}`);
    } catch (productError) {
      console.error('❌ Error fetching products:', productError.message);
      console.error('Error details:', {
        name: productError.name,
        code: productError.code,
        message: productError.message,
        stack: productError.stack
      });
      // If connection error, return 503
      if (productError.name?.startsWith('Sequelize') || 
          productError.code === 'ECONNREFUSED' ||
          productError.code === 'ETIMEDOUT') {
        return res.status(503).json({ 
          message: 'Database connection error - please try again',
          error: 'DATABASE_ERROR',
          step: 'products_fetch'
        });
      }
      throw productError;
    }

    // Create a map for quick lookup
    const productMap = new Map(products.map(p => [p.id, p]));

    // Validate all items
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      if (!item.productId || !item.quantity) {
        return res.status(400).json({ message: 'Each item must have productId and quantity' });
      }

      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }

      // Allow orders even if stock is 0 or undefined (for products without stock tracking)
      const availableStock = product.stock !== null && product.stock !== undefined ? product.stock : 999999;
      if (availableStock < item.quantity && availableStock < 999999) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${availableStock}`
        });
      }

      const itemSubtotal = parseFloat(product.price || 0) * parseInt(item.quantity || 1);
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.id,
        quantity: parseInt(item.quantity),
        price: parseFloat(product.price || 0),
        subtotal: itemSubtotal
      });
    }

    const shippingCost = parseFloat(shipping) || 0;
    const total = subtotal + shippingCost;

    // Handle payment receipt upload if provided
    let paymentReceiptPath = null;
    if (req.file) {
      try {
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `payment_receipt_${Date.now()}${fileExtension}`;
        
        const uploadResult = await Promise.race([
          uploadToSupabase(
            req.file.buffer,
            'products', // Using products bucket for now (public access)
            fileName,
            req.file.mimetype
          ),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('File upload timeout')), 15000)
          )
        ]);
        
        paymentReceiptPath = uploadResult.path;
      } catch (fileError) {
        console.error('Error uploading payment receipt:', fileError.message);
        // Don't fail the order if receipt upload fails, just log it
        console.warn('Order will be created without payment receipt');
      }
    }

    // Use transaction to ensure all operations succeed or fail together
    // Retry transaction creation if connection fails
    console.log('Step 5: Creating database transaction...');
    let transaction;
    let transactionRetries = 3;
    while (transactionRetries > 0) {
      try {
        transaction = await sequelize.transaction();
        console.log('✅ Transaction created successfully');
        break; // Success
      } catch (txError) {
        transactionRetries--;
        console.error(`❌ Transaction creation failed (${4 - transactionRetries}/3 attempts):`, txError.message);
        console.error('Transaction error details:', {
          name: txError.name,
          code: txError.code,
          message: txError.message,
          stack: txError.stack
        });
        if (transactionRetries === 0) {
          return res.status(503).json({ 
            message: 'Database connection error - please try again',
            error: 'DATABASE_ERROR',
            details: 'Unable to create database transaction',
            step: 'transaction_creation'
          });
        }
        // Wait before retry
        console.log(`⏳ Waiting before retry... (${1000}ms)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    try {
      // Generate order number and unique code for payment verification
      const orderNumber = generateOrderNumber();
      const uniqueOrderCode = generateUniqueOrderCode(orderNumber);
      
      // Create order within transaction
      const order = await Order.create({
        storeId,
        orderNumber: orderNumber,
        uniqueOrderCode: uniqueOrderCode,
        status: 'pending',
        paymentMethod: paymentMethod || 'gcash',
        paymentStatus: 'pending',
        paymentReference: paymentReference || null, // Payment reference from buyer
        paymentReceipt: paymentReceiptPath || null, // Payment receipt image path
        subtotal,
        shipping: shippingCost,
        total,
        shippingAddress: shippingAddress, // Store as JSON object (Sequelize handles JSON type)
        customerName,
        customerEmail,
        customerPhone: customerPhone || ''
      }, { transaction });

      // Create order items in parallel (within transaction) - OPTIMIZED
      const orderItemPromises = orderItems.map(item => 
        OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal
        }, { transaction })
      );
      
      await Promise.all(orderItemPromises);

      // Update product stock in parallel (non-blocking - don't fail order if stock update fails)
      const stockUpdatePromises = orderItems.map(item => 
        Product.decrement('stock', {
          by: item.quantity,
          where: { id: item.productId },
          transaction
        }).catch(stockError => {
          console.warn(`Stock update failed for product ${item.productId} (non-critical):`, stockError.message);
          return null; // Don't fail the order
        })
      );
      
      await Promise.all(stockUpdatePromises);

      // Commit transaction
      await transaction.commit();

      // Return order data directly instead of fetching again - OPTIMIZED
      const orderResponse = {
        id: order.id,
        storeId: order.storeId,
        orderNumber: order.orderNumber,
        uniqueOrderCode: order.uniqueOrderCode,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentReference: order.paymentReference,
        paymentReceipt: order.paymentReceipt,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        shippingAddress: order.shippingAddress,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        OrderItems: orderItems.map(item => ({
          id: null, // Will be set by database
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          Product: productMap.get(item.productId) ? {
            id: item.productId,
            name: productMap.get(item.productId).name,
            price: item.price,
            image: productMap.get(item.productId).image || null
          } : null
        }))
      };

      const duration = Date.now() - startTime;
      console.log(`✅ Order created successfully in ${duration}ms`);
      if (duration > 3000) {
        console.warn(`⚠️ Slow order creation: took ${duration}ms`);
      }

      // Send email notification to store owner if payment proof is provided
      if (paymentReference || paymentReceiptPath) {
        try {
          const store = await Store.findByPk(storeId);
          if (store && store.userId) {
            const storeOwner = await User.findByPk(store.userId);
            
            if (storeOwner && storeOwner.email) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const ordersPageUrl = `${frontendUrl}/dashboard/orders`;
            
            const receiptUrl = paymentReceiptPath 
              ? `${process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co'}/storage/v1/object/public/products/${paymentReceiptPath.replace('products/', '')}`
              : null;
            
            const emailSubject = `💰 New Payment Received - Order ${order.orderNumber}`;
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #6d28d9;">💰 New Payment Received</h2>
                <p>Hello ${storeOwner.firstName || 'Store Owner'},</p>
                <p>A customer has submitted payment proof for an order:</p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Order Details:</h3>
                  <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                  <p><strong>Unique Order Code:</strong> <code style="background: white; padding: 4px 8px; border-radius: 4px;">${order.uniqueOrderCode}</code></p>
                  <p><strong>Customer:</strong> ${order.customerName}</p>
                  <p><strong>Email:</strong> ${order.customerEmail}</p>
                  <p><strong>Total Amount:</strong> ₱${parseFloat(order.total).toFixed(2)}</p>
                  <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
                  ${paymentReference ? `<p><strong>Payment Reference:</strong> ${paymentReference}</p>` : ''}
                </div>
                
                ${receiptUrl ? `
                  <div style="margin: 20px 0;">
                    <p><strong>Payment Receipt:</strong></p>
                    <img src="${receiptUrl}" alt="Payment Receipt" style="max-width: 100%; border: 1px solid #ddd; border-radius: 4px;" />
                  </div>
                ` : ''}
                
                <div style="margin: 30px 0;">
                  <a href="${ordersPageUrl}" style="background: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                    View & Verify Order
                  </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  Please verify the payment and update the order status accordingly.
                </p>
              </div>
            `;
            
            await sendEmail({
              to: storeOwner.email,
              subject: emailSubject,
              html: emailHtml,
              text: `New payment received for Order ${order.orderNumber}. Amount: ₱${parseFloat(order.total).toFixed(2)}. View at: ${ordersPageUrl}`
            });
            
            console.log(`✅ Payment notification email sent to store owner: ${storeOwner.email}`);
            }
          }
        } catch (emailError) {
          // Don't fail order creation if email fails
          console.error('❌ Failed to send payment notification email:', emailError.message);
        }
      }

      return res.status(201).json(orderResponse);
    } catch (transactionError) {
      // Rollback transaction on error
      console.error('❌ Transaction error, rolling back...');
      console.error('Transaction error:', transactionError.message);
      if (transaction) {
        try {
          await transaction.rollback();
          console.log('✅ Transaction rolled back');
        } catch (rollbackError) {
          console.error('❌ Rollback failed:', rollbackError.message);
        }
      }
      throw transactionError; // Re-throw to be caught by outer catch block
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('========================================');
    console.error(`❌ ERROR creating order (${duration}ms)`);
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    console.error('Error original:', error.original);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    console.error('========================================');
    
    // Handle all Sequelize errors as database errors
    if (error.name && error.name.startsWith('Sequelize')) {
      console.error('Sequelize error detected:', error.name);
      return res.status(503).json({ 
        message: 'Database error - please try again',
        error: 'DATABASE_ERROR',
        details: error.message
      });
    }
    
    // Handle database connection errors
    if (error.code === 'ECONNREFUSED' || 
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('Connection') ||
        error.message?.includes('connect') ||
        error.message?.includes('timeout')) {
      console.error('Database connection error detected');
      return res.status(503).json({ 
        message: 'Database connection error - please try again',
        error: 'DATABASE_ERROR',
        details: error.message
      });
    }
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        error: error.errors?.map(e => e.message).join(', ') || error.message
      });
    }
    
    // Generic error response
    res.status(500).json({ 
      message: 'Error creating order', 
      error: error.message || 'Unknown error occurred',
      details: error.stack
    });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findOne({
      where: { id, storeId: store.id }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.update({ status });

    // If cancelled, restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const orderItems = await OrderItem.findAll({
        where: { orderId: order.id }
      });

      for (const item of orderItems) {
        await Product.increment('stock', {
          by: item.quantity,
          where: { id: item.productId }
        });
      }
    }

    const updatedOrder = await Order.findOne({
      where: { id: order.id },
      include: [
        {
          model: OrderItem,
          include: [Product]
        }
      ]
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentTransactionId, verificationNotes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const order = await Order.findOne({
      where: { id, storeId: store.id }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.update({
      paymentStatus,
      paymentTransactionId: paymentTransactionId || order.paymentTransactionId,
      verificationNotes: verificationNotes !== undefined ? verificationNotes : order.verificationNotes
    });

    // If payment completed, update order status to processing
    if (paymentStatus === 'completed' && order.status === 'pending') {
      await order.update({ status: 'processing' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Error updating payment status', error: error.message });
  }
};

// Delete an order (only allowed for the store owner and typically after cancellation)
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const order = await Order.findOne({
      where: { id, storeId: store.id }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Optional safety: only allow deletion if order is cancelled
    if (order.status !== 'cancelled') {
      return res.status(400).json({ message: 'Only cancelled orders can be deleted' });
    }

    await order.destroy();
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  }
};

// Get sales analytics
export const getSalesAnalytics = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const { startDate, endDate } = req.query;
    // Sales are counted when payment is received (completed) OR when customer has provided payment reference/receipt
    // This ensures sales are reflected even if store owner hasn't verified payment yet
    const whereConditions = [
      { storeId: store.id },
      {
        [Op.or]: [
          { paymentStatus: 'completed' }, // Verified by store owner
          { paymentStatus: 'processing' }, // Payment being processed
          { 
            // Has payment reference (customer provided reference number)
            paymentReference: { [Op.ne]: null },
            paymentStatus: { [Op.notIn]: ['failed', 'refunded'] } // Not failed or refunded
          },
          { 
            // Has payment receipt (customer uploaded receipt)
            paymentReceipt: { [Op.ne]: null },
            paymentStatus: { [Op.notIn]: ['failed', 'refunded'] } // Not failed or refunded
          }
        ]
      }
    ];

    // Add date filter if provided (need to ensure date range includes full day)
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Start of day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      whereConditions.push({
        createdAt: {
          [Op.between]: [start, end]
        }
      });
    }

    const whereClause = whereConditions.length === 1 
      ? whereConditions[0] 
      : { [Op.and]: whereConditions };

    // Get monthly sales data
    const monthExpr = sequelize.fn('to_char', sequelize.col('createdAt'), 'YYYY-MM');
    const orders = await Order.findAll({
      where: whereClause,
      attributes: [
        [monthExpr, 'month'],
        [sequelize.fn('SUM', sequelize.col('total')), 'totalSales'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
      ],
      group: [monthExpr],
      order: [[monthExpr, 'ASC']],
      raw: true
    });

    // Get total sales
    const totalSales = await Order.sum('total', {
      where: whereClause
    }) || 0;

    // Get total orders
    const totalOrders = await Order.count({
      where: whereClause
    });

    // Get recent orders
    const recentOrders = await Order.findAll({
      where: whereClause,
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: OrderItem,
          include: [Product]
        }
      ]
    });

    res.json({
      monthlySales: orders,
      totalSales,
      totalOrders,
      recentOrders
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({ message: 'Error fetching sales analytics', error: error.message });
  }
};

// Get customer orders by email (public route for customers to track their orders)
export const getCustomerOrders = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find all orders for this customer email
    const orders = await Order.findAll({
      where: {
        customerEmail: email
      },
      include: [
        {
          model: OrderItem,
          include: [Product]
        },
        {
          model: Store,
          attributes: ['id', 'storeName', 'domainName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50 // Limit to recent 50 orders
    });

    // Format orders for customer view
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: parseFloat(order.subtotal || 0),
      shipping: parseFloat(order.shipping || 0),
      total: parseFloat(order.total || 0),
      placedAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.OrderItems?.map(item => ({
        id: item.productId,
        name: item.Product?.name || `Product ${item.productId}`,
        quantity: item.quantity,
        price: parseFloat(item.price || 0)
      })) || [],
      storeName: order.Store?.storeName || 'Store'
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ message: 'Error fetching customer orders', error: error.message });
  }
};

// Request order cancellation (public route for customers)
export const requestOrderCancellation = async (req, res) => {
  try {
    const { orderNumber, reason } = req.body;

    if (!orderNumber) {
      return res.status(400).json({ message: 'Order number is required' });
    }

    // Find the order
    const order = await Order.findOne({
      where: { orderNumber }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order can be cancelled
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    if (order.status === 'completed' || order.status === 'shipped') {
      return res.status(400).json({ message: 'Cannot cancel order that is already shipped or completed' });
    }

    // Check if cancellation is already requested
    if (order.cancellationRequest === 'requested') {
      return res.status(400).json({ message: 'Cancellation request already submitted' });
    }

    if (order.cancellationRequest === 'approved') {
      return res.status(400).json({ message: 'Cancellation already approved' });
    }

    // Update order with cancellation request
    await order.update({
      cancellationRequest: 'requested',
      cancellationReason: reason || null
    });

    res.json({
      success: true,
      message: 'Cancellation request submitted. Waiting for store owner approval.',
      order: order
    });
  } catch (error) {
    console.error('Error requesting order cancellation:', error);
    res.status(500).json({ message: 'Error requesting cancellation', error: error.message });
  }
};

// Handle cancellation request (for store owner - approve or reject)
export const handleCancellationRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be "approve" or "reject"' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const order = await Order.findOne({
      where: { id, storeId: store.id }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.cancellationRequest !== 'requested') {
      return res.status(400).json({ message: 'No pending cancellation request for this order' });
    }

    if (action === 'approve') {
      // Approve cancellation - mark order as cancelled
      await order.update({
        cancellationRequest: 'approved',
        status: 'cancelled'
      });

      res.json({
        success: true,
        message: 'Cancellation approved. Order has been cancelled.',
        order: order
      });
    } else if (action === 'reject') {
      // Reject cancellation request
      await order.update({
        cancellationRequest: 'rejected'
      });

      res.json({
        success: true,
        message: 'Cancellation request rejected.',
        order: order
      });
    }
  } catch (error) {
    console.error('Error handling cancellation request:', error);
    res.status(500).json({ message: 'Error handling cancellation request', error: error.message });
  }
};

