import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const EmailVerificationToken = sequelize.define('EmailVerificationToken', {
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
  tableName: 'EmailVerificationTokens',
});

export default EmailVerificationToken;


