const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  layer: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  availability: {
    type: DataTypes.STRING,
    allowNull: false
  },
  start: DataTypes.DATE,
  end: DataTypes.DATE,
  users: DataTypes.STRING, // comma-separated user list
  colors: DataTypes.JSON, // array of color hex strings
  thumbnail: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Item; 