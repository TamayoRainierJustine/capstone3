import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import SupportTicket from './supportTicket.js';
import User from './user.js';

const SupportMessage = sequelize.define('SupportMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  ticketId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'SupportTickets',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'User who sent the message'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of file paths/URLs'
  },
  isInternal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Internal notes visible only to super admins'
  }
}, {
  tableName: 'SupportMessages',
  timestamps: true
});

// Set up associations
SupportMessage.belongsTo(SupportTicket, { foreignKey: 'ticketId' });
SupportMessage.belongsTo(User, { foreignKey: 'userId' });

SupportTicket.hasMany(SupportMessage, { foreignKey: 'ticketId' });
User.hasMany(SupportMessage, { foreignKey: 'userId' });

export default SupportMessage;

