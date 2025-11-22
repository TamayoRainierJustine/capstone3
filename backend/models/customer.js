import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Customer = sequelize.define('Customer', {
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
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  emailVerifiedAt: { type: DataTypes.DATE, allowNull: true },
  // Address fields
  region: { type: DataTypes.STRING, allowNull: true },
  province: { type: DataTypes.STRING, allowNull: true },
  municipality: { type: DataTypes.STRING, allowNull: true },
  barangay: { type: DataTypes.STRING, allowNull: true },
  houseNumber: { type: DataTypes.STRING, allowNull: true },
  street: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'Customers',
  timestamps: true
});

export default Customer;

