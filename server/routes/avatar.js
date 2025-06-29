// server/routes/avatar.js

const express  = require('express');
const jwt      = require('jsonwebtoken');
const Avatar   = require('../models/avatar');
require('dotenv').config();

const router = express.Router();

// Middleware для проверки JWT
router.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1]; // "Bearer <token>"
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// GET /api/avatar - возвращает массив элементов аватарки
router.get('/', async (req, res) => {
  // Находим или создаём запись аватара для пользователя
  const [avatar] = await Avatar.findOrCreate({ where: { userId: req.userId } });
  console.log(`[AVATAR_GET] userId=${req.userId} configRaw=`, avatar.config);
  // Берём только сохранённую конфигурацию аватара (массив) или пустой массив
  const avatarConfig = Array.isArray(avatar.config.avatarConfig) ? avatar.config.avatarConfig : [];
  console.log(`[AVATAR_GET] returning avatarConfig=`, avatarConfig);
  res.json(avatarConfig);
});

// POST /api/avatar - обновляет массив элементов аватарки
router.post('/', async (req, res) => {
  console.log(`[AVATAR_POST] userId=${req.userId} received config=`, req.body.config);
  const { config } = req.body;
  if (!config) {
    return res.status(400).json({ error: 'Config is required' });
  }
  // Находим или создаём запись аватара для пользователя
  const [avatar] = await Avatar.findOrCreate({ where: { userId: req.userId } });
  const newConfig = { ...avatar.config, avatarConfig: config };
  console.log(`[AVATAR_POST] updating config for userId=${req.userId} newConfig=`, newConfig);
  await avatar.update({ config: newConfig });
  res.json({ message: 'Avatar saved' });
});

module.exports = router;
