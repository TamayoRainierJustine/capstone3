import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const PasswordResetToken = sequelize.define('PasswordResetToken', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  used: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'PasswordResetTokens',
});

export default PasswordResetToken;


