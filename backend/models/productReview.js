import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Product from './product.js';
import Customer from './customer.js';
import Order from './order.js';

const ProductReview = sequelize.define('ProductReview', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'id'
    },
    comment: 'Product being reviewed'
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Customers',
      key: 'id'
    },
    comment: 'Customer who wrote the review'
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Orders',
      key: 'id'
    },
    comment: 'Order ID to verify purchase (optional)'
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    },
    comment: 'Rating from 1 to 5 stars'
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Review comment/feedback'
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of review image paths'
  },
  isVerifiedPurchase: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the review is from a verified purchase'
  },
  isVisible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether the review is visible to public'
  },
  helpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of people who found this review helpful'
  }
}, {
  tableName: 'ProductReviews',
  timestamps: true,
  indexes: [
    {
      fields: ['productId']
    },
    {
      fields: ['customerId']
    },
    {
      fields: ['rating']
    }
  ]
});

// Set up associations
ProductReview.belongsTo(Product, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

ProductReview.belongsTo(Customer, {
  foreignKey: 'customerId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  as: 'Customer'
});

ProductReview.belongsTo(Order, {
  foreignKey: 'orderId',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

export default ProductReview;
