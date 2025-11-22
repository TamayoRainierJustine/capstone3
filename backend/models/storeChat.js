import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Store from './store.js';
import Customer from './customer.js';
import User from './user.js';

const StoreChat = sequelize.define('StoreChat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  storeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Stores',
      key: 'id'
    }
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Customers',
      key: 'id'
    }
  },
  senderType: {
    type: DataTypes.ENUM('customer', 'store_owner'),
    allowNull: false,
    comment: 'Who sent the message'
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of the sender (customerId or userId)'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the message has been read by the recipient'
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Products',
      key: 'id'
    },
    comment: 'Optional: Link message to a specific product'
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Orders',
      key: 'id'
    },
    comment: 'Optional: Link message to a specific order'
  }
}, {
  tableName: 'StoreChats',
  timestamps: true,
  indexes: [
    {
      fields: ['storeId', 'customerId']
    },
    {
      fields: ['storeId', 'isRead']
    }
  ]
});

// Set up associations
StoreChat.belongsTo(Store, { foreignKey: 'storeId' });
StoreChat.belongsTo(Customer, { foreignKey: 'customerId' });
StoreChat.belongsTo(User, { foreignKey: 'senderId', constraints: false }); // Optional, only for store owner messages

Store.hasMany(StoreChat, { foreignKey: 'storeId' });
Customer.hasMany(StoreChat, { foreignKey: 'customerId' });

export default StoreChat;

