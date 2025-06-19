// server/config/db.js
require('dotenv').config();             // загружаем .env-переменные
const { Sequelize } = require('sequelize');

// создаём подключение к SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE      // имя файла из .env
});

module.exports = sequelize;
