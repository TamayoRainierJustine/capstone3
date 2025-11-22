import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { 
    type: DataTypes.ENUM('user', 'admin', 'super_admin'), 
    defaultValue: 'user',
    comment: 'user = customer/buyer, admin = store owner, super_admin = system admin'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'Users',
  timestamps: true
});

export default User;
