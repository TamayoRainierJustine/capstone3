import Order from '../models/order.js';
import OrderItem from '../models/orderItem.js';
import Product from '../models/product.js';
import Store from '../models/store.js';
import sequelize from '../config/db.js';
import { Op } from 'sequelize';

// Generate unique order number
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
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
  try {
    const {
      storeId,
      items,
      shippingAddress,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      shipping
    } = req.body;

    // Validate required fields
    if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Store ID and items are required' });
    }

    if (!customerName || !customerEmail || !paymentMethod) {
      return res.status(400).json({ message: 'Customer name, email, and payment method are required' });
    }

    if (!shippingAddress || !shippingAddress.region || !shippingAddress.province || 
        !shippingAddress.municipality || !shippingAddress.barangay) {
      return res.status(400).json({ message: 'Complete shipping address is required' });
    }

    // Validate store exists and is published
    const store = await Store.findOne({
      where: { id: storeId, status: 'published' },
      attributes: ['id', 'status']
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found or not published' });
    }

    // Validate products and calculate totals - OPTIMIZED: fetch all products in parallel
    const productIds = items.map(item => item.productId);
    
    // Fetch all products in parallel instead of sequentially
    const products = await Product.findAll({
      where: { 
        id: { [Op.in]: productIds },
        storeId, 
        isActive: true 
      },
      attributes: ['id', 'name', 'price', 'stock']
    });

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

    // Use transaction to ensure all operations succeed or fail together
    const transaction = await sequelize.transaction();

    try {
      // Create order within transaction
      const order = await Order.create({
        storeId,
        orderNumber: generateOrderNumber(),
        status: 'pending',
        paymentMethod: paymentMethod || 'gcash',
        paymentStatus: 'pending',
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
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
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
      if (duration > 3000) {
        console.warn(`Slow order creation: took ${duration}ms`);
      }

      return res.status(201).json(orderResponse);
    } catch (transactionError) {
      // Rollback transaction on error
      await transaction.rollback();
      throw transactionError; // Re-throw to be caught by outer catch block
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Error creating order (${duration}ms):`, error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error original:', error.original);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    
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
    const { paymentStatus, paymentTransactionId } = req.body;
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
      paymentTransactionId: paymentTransactionId || order.paymentTransactionId
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
    const whereClause = {
      storeId: store.id,
      status: 'completed',
      paymentStatus: 'completed'
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get monthly sales data
    const orders = await Order.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
        [sequelize.fn('SUM', sequelize.col('total')), 'totalSales'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'ASC']],
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

