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

// GET /api/avatar
// Возвращает JSON-конфиг аватара пользователя
router.get('/', async (req, res) => {
  const avatar = await Avatar.findOne({ where: { userId: req.userId } });
  res.json(avatar.config);
});

// POST /api/avatar
// Обновляет конфигурацию аватара
router.post('/', async (req, res) => {
  const { config } = req.body;
  if (!config) {
    return res.status(400).json({ error: 'Config is required' });
  }
  await Avatar.update(
    { config },
    { where: { userId: req.userId } }
  );
  res.json({ message: 'Avatar saved' });
});

module.exports = router;
