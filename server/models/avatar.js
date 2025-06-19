// server/models/avatar.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Определяем модель Avatar (таблица avatars)
const Avatar = sequelize.define('Avatar', {
  // Ссылаемся на пользователя (User.id) — число, уникально, обязательно
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  // JSON-конфигурация: слои, выбранные вещи, цвета и т.д.
  config: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  }
});

module.exports = Avatar;
