import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Store from './store.js';
import User from './user.js';

const Order = sequelize.define('Order', {
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
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.ENUM('gcash', 'paypal', 'card', 'cod'),
    allowNull: false
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  paymentTransactionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentReference: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Payment reference number inputted by buyer (e.g., GCash reference number)'
  },
  paymentReceipt: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Payment receipt/screenshot image path uploaded by buyer'
  },
  verificationNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes added by store owner during payment verification'
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  shipping: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  shippingAddress: {
    type: DataTypes.JSON,
    allowNull: false
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customerPhone: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Orders',
  timestamps: true
});

// Set up associations
Order.belongsTo(Store, {
  foreignKey: 'storeId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Order.belongsTo(User, {
  foreignKey: 'customerId',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

Store.hasMany(Order, {
  foreignKey: 'storeId'
});

export default Order;

