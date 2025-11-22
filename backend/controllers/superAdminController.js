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
    
    // Count unique store owners (users who have at least one store)
    // Use distinct userId from stores table instead of counting all admin users
    const uniqueStoreOwners = await Store.count({
      distinct: true,
      col: 'userId',
      where: {
        userId: { [Op.ne]: null } // Exclude stores with null userId
      }
    });
    
    const totalUsers = uniqueStoreOwners; // Use the count of unique store owners
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
      unpublishedStores: totalStores - publishedStores,
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
