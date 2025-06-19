// server/models/user.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Определяем модель User (таблица users)
const User = sequelize.define('User', {
  // Логин (имя пользователя) — строка, уникально, обязательно
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  // Пароль — строка, обязательно (мы будем хранить хэш)
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = User;
