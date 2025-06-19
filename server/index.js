// EduXP/server/index.js

require('dotenv').config();                  // 1. Загружаем .env
const express = require('express');          // 2. Express для сервера
const path    = require('path');             // 3. Path для работы с путями
const cors    = require('cors');             // 4. CORS для запросов из фронтенда
const sequelize = require('./config/db');    // 5. Подключение к БД

// 6. Импортируем маршруты
const authRouter   = require('./routes/auth');
const avatarRouter = require('./routes/avatar');

const app = express();

// 7. Middleware: CORS + JSON-парсер
app.use(cors());
app.use(express.json());

// 8. Синхронизируем модели (создаём таблицы users и avatars в SQLite)
(async () => {
  try {
    await sequelize.sync();
    console.log('Database synced');
  } catch (err) {
    console.error('DB sync error:', err);
  }
})();

// 9. Раздаём статические файлы вашего клиента
app.use(express.static(path.join(__dirname, '..')));

// 10. Подключаем API-маршруты
app.use('/api/auth', authRouter);
app.use('/api/avatar', avatarRouter);

// Добавляем маршруты для списка предметов и разблокированных предметов
const itemsRouter = require('./routes/items');
const unlockedItemsRouter = require('./routes/unlockedItems');
app.use('/api/items', itemsRouter);
app.use('/api/unlockedItems', unlockedItemsRouter);

// 11. Для любых других GET-запросов отдаём index.html (незаменимо для SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'EduXP', 'index.html'));
});

// 12. Стартуем сервер на порту из .env или 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
