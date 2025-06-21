// EduXP/server/index.js

require('dotenv').config();                  // 1. Загружаем .env
const express = require('express');          // 2. Express для сервера
const path    = require('path');             // 3. Path для работы с путями
const cors    = require('cors');             // 4. CORS для запросов из фронтенда
const sequelize = require('./config/db');    // 5. Подключение к БД

// 6. Импортируем маршруты
const authRouter   = require('./routes/auth');
const avatarRouter = require('./routes/avatar');
// Модель предметов
const Item = require('./models/item');

const app = express();

// 7. Middleware: CORS + JSON-парсер
app.use(cors());
app.use(express.json());

// Отключаем кеширование для API-запросов
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// 8. Синхронизация моделей: alter:true добавит отсутствующие столбцы без удаления данных
(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synced (alter:true)');
  } catch (err) {
    console.error('DB sync error:', err);
  }
})();

// --- Защита панели администратора: только с корректным cookie ---
app.use('/admin', (req, res, next) => {
  const cookieHeader = req.headers.cookie || '';
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});
  const expectedEncoded = Buffer.from('SoraKotoneru:ghbywtccf@3141').toString('base64');
  if (cookies.adminAuth === expectedEncoded) {
    return next();
  }
  // Если нет валидного cookie, редирект на страницу входа
  return res.redirect('/index.html');
});

// 9. Раздаём статические файлы вашего клиента
app.use(express.static(path.join(__dirname, '..')));

// 10. Подключаем API-маршруты
app.use('/api/auth', authRouter);
app.use('/api/avatar', avatarRouter);

// Добавляем маршруты для списка предметов и разблокированных предметов
const itemsRouter = require('./routes/items');
const unlockedItemsRouter = require('./routes/unlockedItems');
const usersRouter = require('./routes/users');
app.use('/api/items', itemsRouter);
app.use('/api/unlockedItems', unlockedItemsRouter);
app.use('/api/users', usersRouter);

// 11. Для любых других GET-запросов отдаём index.html (незаменимо для SPA)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 12. Стартуем сервер на порту из .env или 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
