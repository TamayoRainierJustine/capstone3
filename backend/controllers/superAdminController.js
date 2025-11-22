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
    if (status) {
      whereClause.isPublished = status === 'published';
    }
    if (search) {
      whereClause[Op.or] = [
        { storeName: { [Op.iLike]: `%${search}%` } },
        { domainName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const stores = await Store.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(stores);
  } catch (error) {
    console.error('Error fetching all stores:', error);
    res.status(500).json({ message: 'Error fetching stores', error: error.message });
  }
};

// Get store statistics
export const getStoreStatistics = async (req, res) => {
  try {
    const totalStores = await Store.count();
    const publishedStores = await Store.count({ where: { isPublished: true } });
    const totalUsers = await User.count({ where: { role: 'admin' } });
    const totalOrders = await Order.count();
    const totalRevenue = await Order.sum('total', {
      where: { paymentStatus: 'completed' }
    }) || 0;

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

    await store.update({ isPublished });
    res.json({ message: 'Store status updated', store });
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

