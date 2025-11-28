import Store from '../models/store.js';
import User from '../models/user.js';
import Order from '../models/order.js';
import { Op } from 'sequelize';

// Get all stores (Super Admin only)
export const getAllStores = async (req, res) => {
  try {
    console.log('📊 getAllStores called by user:', req.user?.email, 'role:', req.user?.role);
    
    const { status, search } = req.query;
    console.log('📊 Query params - status:', status, 'search:', search);
    
    const whereClause = {};
    if (status === 'published') {
      whereClause.status = 'published';
    } else if (status === 'unpublished' || status === 'draft') {
      whereClause.status = 'draft';
    } else if (status === 'suspended') {
      whereClause.status = 'suspended';
    }
    // If status is 'all' or not provided, don't filter by status
    
    if (search) {
      whereClause[Op.or] = [
        { storeName: { [Op.iLike]: `%${search}%` } },
        { domainName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    console.log('📊 Where clause:', JSON.stringify(whereClause));

    // Fetch stores first without include to avoid association issues
    const stores = await Store.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'userId', 'templateId', 'storeName', 'description', 'domainName', 
                   'region', 'province', 'municipality', 'barangay', 'contactEmail', 
                   'phone', 'logo', 'status', 'content', 'createdAt', 'updatedAt'],
      raw: false // Keep as instances
    });
    
    console.log('📊 Found', stores.length, 'stores');
    
    // Fetch user data separately
    const userIds = [...new Set(stores.map(s => s.userId).filter(id => id !== null && id !== undefined))];
    let userMap = new Map();
    
    if (userIds.length > 0) {
      try {
        const users = await User.findAll({
          where: { id: { [Op.in]: userIds } },
          attributes: ['id', 'firstName', 'lastName', 'email'],
          raw: true
        });
        
        userMap = new Map(users.map(u => [u.id, u]));
        console.log('📊 Found', users.length, 'users');
      } catch (userError) {
        console.error('⚠️ Error fetching users:', userError);
        // Continue without user data
      }
    }
    
    // Format stores with user data
    const formattedStores = stores.map(store => {
      const storeData = store.toJSON();
      
      // Add user data if available
      if (storeData.userId && userMap.has(storeData.userId)) {
        storeData.User = userMap.get(storeData.userId);
      }
      
      // Parse content if it's a string
      if (storeData.content && typeof storeData.content === 'string') {
        try {
          storeData.content = JSON.parse(storeData.content);
        } catch (e) {
          console.error('Error parsing store content:', e);
        }
      }
      
      return storeData;
    });

    console.log('✅ Returning', formattedStores.length, 'stores');
    res.json(formattedStores);
  } catch (error) {
    console.error('❌ Error in getAllStores:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error name:', error.name);
    if (error.original) {
      console.error('❌ Original error:', error.original);
    }
    if (error.stack) {
      console.error('❌ Stack trace:', error.stack);
    }
    
    res.status(500).json({ 
      message: 'Error fetching stores', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        stack: error.stack,
        original: error.original
      } : undefined
    });
  }
};

// Get store statistics
export const getStoreStatistics = async (req, res) => {
  try {
    console.log('📊 getStoreStatistics called by user:', req.user?.email, 'role:', req.user?.role);
    
    const totalStores = await Store.count();
    const publishedStores = await Store.count({ where: { status: 'published' } });
    const suspendedStores = await Store.count({ where: { status: 'suspended' } });
    
    // Count unique store owners (users who have at least one store)
    // Use raw query to count distinct userIds from stores table
    const sequelize = Store.sequelize;
    const uniqueStoreOwnersResult = await sequelize.query(
      `SELECT COUNT(DISTINCT "userId") as count FROM "Stores" WHERE "userId" IS NOT NULL`,
      { type: sequelize.QueryTypes.SELECT }
    );
    const totalUsers = parseInt(uniqueStoreOwnersResult[0]?.count || 0);
    
    const totalOrders = await Order.count();
    
    // Calculate revenue from orders with completed payment
    let totalRevenue = 0;
    try {
      // Get all completed orders and calculate total manually
      const completedOrders = await Order.findAll({
        where: { paymentStatus: 'completed' },
        attributes: ['subtotal', 'shipping', 'total'],
        raw: true
      });
      
      totalRevenue = completedOrders.reduce((sum, order) => {
        // Try to use 'total' column first, otherwise calculate from subtotal + shipping
        if (order.total !== null && order.total !== undefined) {
          return sum + parseFloat(order.total || 0);
        } else {
          const subtotal = parseFloat(order.subtotal || 0);
          const shipping = parseFloat(order.shipping || 0);
          return sum + subtotal + shipping;
        }
      }, 0);
    } catch (revenueError) {
      console.error('Error calculating revenue:', revenueError);
      totalRevenue = 0;
    }

    const stats = {
      totalStores,
      publishedStores,
      unpublishedStores: totalStores - publishedStores - suspendedStores,
      suspendedStores,
      totalUsers,
      totalOrders,
      totalRevenue: parseFloat(totalRevenue)
    };
    
    console.log('✅ Statistics:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error fetching statistics', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update store status (activate/deactivate)
export const updateStoreStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const store = await Store.findByPk(id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Convert isPublished boolean to status enum
    const newStatus = isPublished ? 'published' : 'draft';
    await store.update({ status: newStatus });
    
    const updatedStore = await Store.findByPk(id, {
      attributes: ['id', 'userId', 'templateId', 'storeName', 'description', 'domainName', 
                   'region', 'province', 'municipality', 'barangay', 'contactEmail', 
                   'phone', 'logo', 'status', 'content', 'createdAt', 'updatedAt']
    });
    
    // Fetch user data separately
    if (updatedStore.userId) {
      const user = await User.findByPk(updatedStore.userId, {
        attributes: ['id', 'firstName', 'lastName', 'email']
      });
      if (user) {
        updatedStore.dataValues.User = user;
      }
    }
    
    res.json({ message: 'Store status updated', store: updatedStore.toJSON() });
  } catch (error) {
    console.error('Error updating store status:', error);
    res.status(500).json({ message: 'Error updating store status', error: error.message });
  }
};

// Get store details
export const getStoreDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findByPk(id, {
      attributes: ['id', 'userId', 'templateId', 'storeName', 'description', 'domainName', 
                   'region', 'province', 'municipality', 'barangay', 'contactEmail', 
                   'phone', 'logo', 'status', 'content', 'createdAt', 'updatedAt']
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Fetch user data separately
    if (store.userId) {
      const user = await User.findByPk(store.userId, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt']
      });
      if (user) {
        store.dataValues.User = user;
      }
    }

    // Get store statistics
    const orderCount = await Order.count({ where: { storeId: store.id } });
    const totalRevenue = await Order.sum('total', {
      where: { storeId: store.id, paymentStatus: 'completed' }
    }) || 0;

    const storeData = store.toJSON();
    
    res.json({
      ...storeData,
      statistics: {
        orderCount,
        totalRevenue: parseFloat(totalRevenue)
      }
    });
  } catch (error) {
    console.error('Error fetching store details:', error);
    res.status(500).json({ message: 'Error fetching store details', error: error.message });
  }
};

// Get store performance (top stores by revenue and orders)
export const getStorePerformance = async (req, res) => {
  try {
    console.log('📊 getStorePerformance called by user:', req.user?.email);
    
    // Get all stores
    const stores = await Store.findAll({
      attributes: ['id', 'storeName', 'domainName', 'status', 'userId']
    });

    // Fetch user data separately (consistent with getAllStores)
    const userIds = [...new Set(stores.map(s => s.userId).filter(id => id !== null && id !== undefined))];
    let userMap = new Map();
    
    if (userIds.length > 0) {
      try {
        const users = await User.findAll({
          where: { id: { [Op.in]: userIds } },
          attributes: ['id', 'firstName', 'lastName', 'email'],
          raw: true
        });
        userMap = new Map(users.map(u => [u.id, u]));
      } catch (userError) {
        console.error('⚠️ Error fetching users:', userError);
      }
    }

    // Calculate performance metrics for each store
    const performanceData = await Promise.all(
      stores.map(async (store) => {
        const storeData = store.toJSON();
        const user = storeData.userId ? userMap.get(storeData.userId) : null;

        const orderCount = await Order.count({
          where: { storeId: store.id }
        });

        const completedOrders = await Order.findAll({
          where: {
            storeId: store.id,
            paymentStatus: 'completed'
          },
          attributes: ['total', 'subtotal', 'shipping'],
          raw: true
        });

        const totalRevenue = completedOrders.reduce((sum, order) => {
          if (order.total !== null && order.total !== undefined) {
            return sum + parseFloat(order.total || 0);
          } else {
            const subtotal = parseFloat(order.subtotal || 0);
            const shipping = parseFloat(order.shipping || 0);
            return sum + subtotal + shipping;
          }
        }, 0);

        return {
          id: store.id,
          storeName: store.storeName,
          domainName: store.domainName,
          status: store.status,
          ownerName: user ? `${user.firstName} ${user.lastName}` : 'N/A',
          ownerEmail: user?.email || '',
          totalOrders: orderCount,
          totalRevenue: parseFloat(totalRevenue)
        };
      })
    );

    // Sort by revenue (descending), then by orders (descending)
    performanceData.sort((a, b) => {
      if (b.totalRevenue !== a.totalRevenue) {
        return b.totalRevenue - a.totalRevenue;
      }
      return b.totalOrders - a.totalOrders;
    });

    // Return top 10 stores
    const topStores = performanceData.slice(0, 10);

    console.log('✅ Store performance data:', topStores.length, 'stores');
    res.json(topStores);
  } catch (error) {
    console.error('❌ Error fetching store performance:', error);
    res.status(500).json({
      message: 'Error fetching store performance',
      error: error.message
    });
  }
};

// Get all orders across all stores (Super Admin only)
export const getAllOrders = async (req, res) => {
  try {
    console.log('📊 getAllOrders called by user:', req.user?.email);
    
    const { status, paymentStatus, storeId, search } = req.query;
    
    const whereClause = {};
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      whereClause.paymentStatus = paymentStatus;
    }
    
    if (storeId && storeId !== 'all') {
      whereClause.storeId = storeId;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { orderNumber: { [Op.iLike]: `%${search}%` } },
        { customerName: { [Op.iLike]: `%${search}%` } },
        { customerEmail: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: Store,
          attributes: ['id', 'storeName', 'domainName', 'status']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 500 // Limit to prevent large queries
    });

    const formattedOrders = orders.map(order => {
      const orderData = order.toJSON();
      return orderData;
    });

    console.log('✅ Returning', formattedOrders.length, 'orders');
    res.json(formattedOrders);
  } catch (error) {
    console.error('❌ Error in getAllOrders:', error);
    res.status(500).json({
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Suspend/Unsuspend store (Super Admin only)
export const suspendStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'suspend' or 'unsuspend'

    const store = await Store.findByPk(id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Determine new status based on action
    let newStatus;
    if (action === 'suspend') {
      newStatus = 'suspended';
    } else if (action === 'unsuspend') {
      // When unsuspending, revert to draft (store owner can republish later)
      newStatus = 'draft';
    } else {
      return res.status(400).json({ message: 'Invalid action. Use "suspend" or "unsuspend"' });
    }

    await store.update({ status: newStatus });
    
    const updatedStore = await Store.findByPk(id, {
      attributes: ['id', 'userId', 'templateId', 'storeName', 'description', 'domainName', 
                   'region', 'province', 'municipality', 'barangay', 'contactEmail', 
                   'phone', 'logo', 'status', 'content', 'createdAt', 'updatedAt']
    });
    
    // Fetch user data separately
    if (updatedStore.userId) {
      const user = await User.findByPk(updatedStore.userId, {
        attributes: ['id', 'firstName', 'lastName', 'email']
      });
      if (user) {
        updatedStore.dataValues.User = user;
      }
    }
    
    res.json({ 
      message: `Store ${action === 'suspend' ? 'suspended' : 'unsuspended'} successfully`, 
      store: updatedStore.toJSON() 
    });
  } catch (error) {
    console.error('Error suspending/unsuspending store:', error);
    res.status(500).json({ 
      message: `Error ${req.body.action === 'suspend' ? 'suspending' : 'unsuspending'} store`, 
      error: error.message 
    });
  }
};

// Delete store (Super Admin only)
export const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findByPk(id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Delete the store (cascade will handle related products and orders)
    await store.destroy();

    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    console.error('Error deleting store:', error);
    res.status(500).json({ message: 'Error deleting store', error: error.message });
  }
};
