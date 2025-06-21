const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Pivot-таблица для доступа private-предметов у пользователей
const ItemUser = sequelize.define('ItemUser', {
  itemId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'Items', key: 'id' }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  }
}, {
  tableName: 'ItemUsers',
  timestamps: false
});

module.exports = ItemUser; 