import Store from '../models/store.js';
import User from '../models/user.js';
import Order from '../models/order.js';
import { Op } from 'sequelize';

// Ensure associations are set up
import '../models/store.js'; // This will run the associations

// Get all stores (Super Admin only)
export const getAllStores = async (req, res) => {
  try {
    const { status, search } = req.query;
    
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

    // Use raw query with JOIN to avoid association issues
    let stores;
    try {
      stores = await Store.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            attributes: ['id', 'firstName', 'lastName', 'email'],
            required: false // LEFT JOIN
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    } catch (includeError) {
      console.error('Error with include, trying without:', includeError);
      // Fallback: query stores without User include
      stores = await Store.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      });
      
      // Manually fetch user data for each store
      for (const store of stores) {
        if (store.userId) {
          try {
            const user = await User.findByPk(store.userId, {
              attributes: ['id', 'firstName', 'lastName', 'email']
            });
            if (user) {
              store.dataValues.User = user;
            }
          } catch (userError) {
            console.error(`Error fetching user for store ${store.id}:`, userError);
          }
        }
      }
    }

    // Parse content if needed and format response
    const formattedStores = stores.map(store => {
      const storeData = store.toJSON();
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

    res.json(formattedStores);
  } catch (error) {
    console.error('Error fetching all stores:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error fetching stores', error: error.message });
  }
};

// Get store statistics
export const getStoreStatistics = async (req, res) => {
  try {
    const totalStores = await Store.count();
    const publishedStores = await Store.count({ where: { status: 'published' } });
    const totalUsers = await User.count({ where: { role: 'admin' } });
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

    res.json({
      totalStores,
      publishedStores,
      unpublishedStores: totalStores - publishedStores,
      totalUsers,
      totalOrders,
      totalRevenue: parseFloat(totalRevenue)
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
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
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ]
    });
    
    res.json({ message: 'Store status updated', store: updatedStore });
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
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt']
        }
      ]
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Get store statistics
    const orderCount = await Order.count({ where: { storeId: store.id } });
    const totalRevenue = await Order.sum('total', {
      where: { storeId: store.id, paymentStatus: 'completed' }
    }) || 0;

    res.json({
      ...store.toJSON(),
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

