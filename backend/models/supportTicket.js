import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './user.js';
import Store from './store.js';

const SupportTicket = sequelize.define('SupportTicket', {
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
    comment: 'Store owner who created the ticket'
  },
  storeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Stores',
      key: 'id'
    },
    comment: 'Related store (if applicable)'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
    defaultValue: 'open'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  category: {
    type: DataTypes.ENUM('general', 'technical', 'billing', 'api_application', 'other'),
    defaultValue: 'general'
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Super admin assigned to handle this ticket'
  },
  lastRepliedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  lastRepliedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'SupportTickets',
  timestamps: true
});

// Set up associations
SupportTicket.belongsTo(User, { foreignKey: 'userId', as: 'creator' });
SupportTicket.belongsTo(Store, { foreignKey: 'storeId' });
SupportTicket.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
SupportTicket.belongsTo(User, { foreignKey: 'lastRepliedBy', as: 'lastReplier' });

User.hasMany(SupportTicket, { foreignKey: 'userId' });
Store.hasMany(SupportTicket, { foreignKey: 'storeId' });

export default SupportTicket;

