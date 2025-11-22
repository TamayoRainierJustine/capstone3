import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './user.js';
import Store from './store.js';

const ApiApplication = sequelize.define('ApiApplication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Store owner who applied'
  },
  storeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Stores',
      key: 'id'
    }
  },
  apiType: {
    type: DataTypes.ENUM('qr', 'shipping', 'both'),
    allowNull: false,
    comment: 'Type of API being applied for'
  },
  status: {
    type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  businessAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  contactNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Document uploads
  birDocument: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Path to BIR document file'
  },
  businessPermit: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Path to business permit file'
  },
  validId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Path to valid ID file'
  },
  otherDocuments: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of other document paths'
  },
  // Review fields
  reviewedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Super admin who reviewed'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reviewNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Internal notes from reviewer'
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for rejection (if rejected)'
  },
  // API credentials (set after approval)
  qrApiKey: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'QR API key (set after approval)'
  },
  shippingApiKey: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Shipping API key (set after approval)'
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'ApiApplications',
  timestamps: true
});

// Set up associations
ApiApplication.belongsTo(User, { foreignKey: 'userId', as: 'applicant' });
ApiApplication.belongsTo(Store, { foreignKey: 'storeId' });
ApiApplication.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

User.hasMany(ApiApplication, { foreignKey: 'userId' });
Store.hasMany(ApiApplication, { foreignKey: 'storeId' });

export default ApiApplication;

