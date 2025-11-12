import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './user.js';

const Store = sequelize.define('Store', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  templateId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  storeName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'uniqueStoreNamePerUser'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  domainName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  region: {
    type: DataTypes.STRING,
    allowNull: false
  },
  province: {
    type: DataTypes.STRING,
    allowNull: false
  },
  municipality: {
    type: DataTypes.STRING,
    allowNull: false
  },
  barangay: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'published'),
    defaultValue: 'draft'
  },
  content: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    get() {
      const rawValue = this.getDataValue('content');
      if (rawValue === null || rawValue === undefined) {
        return null;
      }
      // If it's already an object, return it
      if (typeof rawValue === 'object' && !Array.isArray(rawValue)) {
        return rawValue;
      }
      // If it's a string, try to parse it
      if (typeof rawValue === 'string') {
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          console.error('Error parsing content JSON:', e);
          return null;
        }
      }
      return rawValue;
    },
    set(value) {
      // Ensure we're storing a proper object
      if (value === null || value === undefined) {
        this.setDataValue('content', null);
      } else if (typeof value === 'string') {
        try {
          this.setDataValue('content', JSON.parse(value));
        } catch (e) {
          console.error('Error parsing content string:', e);
          this.setDataValue('content', value);
        }
      } else {
        this.setDataValue('content', value);
      }
    }
  }
}, {
  tableName: 'Stores',
  timestamps: true
});

// Set up the association
Store.belongsTo(User, { 
  foreignKey: 'userId',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});
User.hasMany(Store, { 
  foreignKey: 'userId'
});

// Note: Store.hasMany(Product) is set up in app.js after all models are loaded

export default Store; 