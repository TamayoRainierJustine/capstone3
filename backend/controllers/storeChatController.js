import StoreChat from '../models/storeChat.js';
import Store from '../models/store.js';
import Customer from '../models/customer.js';
import User from '../models/user.js';
import Product from '../models/product.js';
import sequelize from '../config/db.js';
import { Op } from 'sequelize';

// Get all conversations for a store owner
export const getStoreConversations = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Get unique customers who have messaged this store
    const conversationsRaw = await StoreChat.findAll({
      where: { storeId: store.id },
      attributes: [
        'customerId',
        [sequelize.fn('MAX', sequelize.col('StoreChat.createdAt')), 'lastMessageAt'],
        [sequelize.fn('COUNT', sequelize.col('StoreChat.id')), 'messageCount']
      ],
      group: ['customerId'],
      raw: true
    });

    // Get unread counts separately
    const unreadCounts = await StoreChat.findAll({
      where: {
        storeId: store.id,
        senderType: 'customer',
        isRead: false
      },
      attributes: [
        'customerId',
        [sequelize.fn('COUNT', sequelize.col('StoreChat.id')), 'unreadCount']
      ],
      group: ['customerId'],
      raw: true
    });

    const unreadMap = new Map(unreadCounts.map(item => [item.customerId, parseInt(item.unreadCount || 0)]));

    // Get last message for each conversation
    const conversationsWithLastMessage = await Promise.all(
      conversationsRaw.map(async (conv) => {
        const customerId = conv.customerId;
        const customer = await Customer.findByPk(customerId, {
          attributes: ['id', 'firstName', 'lastName', 'email']
        });

        const lastMessage = await StoreChat.findOne({
          where: {
            storeId: store.id,
            customerId: customerId
          },
          order: [['createdAt', 'DESC']],
          limit: 1
        });

        return {
          customerId: customerId,
          customer: customer,
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            message: lastMessage.message,
            senderType: lastMessage.senderType,
            createdAt: lastMessage.createdAt,
            isRead: lastMessage.isRead
          } : null,
          unreadCount: unreadMap.get(customerId) || 0
        };
      })
    );

    res.json(conversationsWithLastMessage);
  } catch (error) {
    console.error('Error fetching store conversations:', error);
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
};

// Get messages for a specific customer conversation
export const getCustomerMessages = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { customerId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const messages = await StoreChat.findAll({
      where: {
        storeId: store.id,
        customerId: parseInt(customerId)
      },
      include: [
        {
          model: Customer,
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Mark messages as read
    await StoreChat.update(
      { isRead: true },
      {
        where: {
          storeId: store.id,
          customerId: parseInt(customerId),
          senderType: 'customer',
          isRead: false
        }
      }
    );

    res.json(messages);
  } catch (error) {
    console.error('Error fetching customer messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// Store owner sends a message to customer
export const sendStoreMessage = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { customerId, message, productId, orderId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const chatMessage = await StoreChat.create({
      storeId: store.id,
      customerId: parseInt(customerId),
      senderType: 'store_owner',
      senderId: userId,
      message: message.trim(),
      productId: productId || null,
      orderId: orderId || null,
      isRead: false
    });

    const messageWithDetails = await StoreChat.findByPk(chatMessage.id, {
      include: [
        {
          model: Customer,
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(201).json(messageWithDetails);
  } catch (error) {
    console.error('Error sending store message:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Customer gets their conversations with a store
export const getCustomerConversations = async (req, res) => {
  try {
    const customerId = req.customer?.id;
    const { storeId } = req.params;

    if (!customerId) {
      return res.status(401).json({ message: 'Customer not authenticated' });
    }

    const messages = await StoreChat.findAll({
      where: {
        storeId: parseInt(storeId),
        customerId: customerId
      },
      include: [
        {
          model: Store,
          attributes: ['id', 'storeName', 'logo']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Mark store owner messages as read
    await StoreChat.update(
      { isRead: true },
      {
        where: {
          storeId: parseInt(storeId),
          customerId: customerId,
          senderType: 'store_owner',
          isRead: false
        }
      }
    );

    res.json(messages);
  } catch (error) {
    console.error('Error fetching customer conversations:', error);
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
};

// Customer sends a message to store
export const sendCustomerMessage = async (req, res) => {
  try {
    const customerId = req.customer?.id;
    const { storeId, message, productId, orderId } = req.body;

    if (!customerId) {
      return res.status(401).json({ message: 'Customer not authenticated' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if this is the first message from this customer (no store owner has replied yet)
    const existingMessages = await StoreChat.count({
      where: {
        storeId: parseInt(storeId),
        customerId: customerId
      }
    });

    // Check if store owner has already sent a message to this customer
    const hasStoreOwnerMessage = await StoreChat.findOne({
      where: {
        storeId: parseInt(storeId),
        customerId: customerId,
        senderType: 'store_owner'
      }
    });

    // Create the customer's message
    const chatMessage = await StoreChat.create({
      storeId: parseInt(storeId),
      customerId: customerId,
      senderType: 'customer',
      senderId: customerId,
      message: message.trim(),
      productId: productId || null,
      orderId: orderId || null,
      isRead: false
    });

    // If this is the first conversation and store owner hasn't replied, send auto-reply
    let autoReplyMessage = null;
    if (!hasStoreOwnerMessage) {
      // Get store owner (user) for the auto-reply
      const storeOwner = await User.findByPk(store.userId);
      
      // Default auto-reply message (can be customized in store settings later)
      const autoReplyText = `Hi! Thank you for reaching out to ${store.storeName}. We have received your message and will get back to you as soon as possible. In the meantime, feel free to ask any questions about our products or services.`;
      
      // Create auto-reply message
      autoReplyMessage = await StoreChat.create({
        storeId: parseInt(storeId),
        customerId: customerId,
        senderType: 'store_owner',
        senderId: store.userId,
        message: autoReplyText,
        productId: null,
        orderId: null,
        isRead: true // Mark as read since it's automated
      });

      // Get the auto-reply with store details for response
      const autoReplyWithDetails = await StoreChat.findByPk(autoReplyMessage.id, {
        include: [
          {
            model: Store,
            attributes: ['id', 'storeName', 'logo']
          }
        ]
      });

      // Store auto-reply in the response for the frontend
      autoReplyMessage = autoReplyWithDetails;
    }

    const messageWithDetails = await StoreChat.findByPk(chatMessage.id, {
      include: [
        {
          model: Store,
          attributes: ['id', 'storeName', 'logo']
        }
      ]
    });

    // Return both messages if auto-reply was sent
    res.status(201).json({
      customerMessage: messageWithDetails,
      autoReply: autoReplyMessage
    });
  } catch (error) {
    console.error('Error sending customer message:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Get unread message count for store owner
export const getStoreUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const unreadCount = await StoreChat.count({
      where: {
        storeId: store.id,
        senderType: 'customer',
        isRead: false
      }
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
};

