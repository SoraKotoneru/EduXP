// server/config/db.js
require('dotenv').config();             // загружаем .env-переменные
const { Sequelize } = require('sequelize');
const path = require('path');

// создаём подключение к SQLite
const storagePath = process.env.DB_STORAGE || path.join(__dirname, '..', 'db.sqlite');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath
});

module.exports = sequelize;
