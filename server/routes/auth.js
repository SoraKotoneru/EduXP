// server/routes/auth.js

const express  = require('express');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const User     = require('../models/user');
const Avatar   = require('../models/avatar');
require('dotenv').config();

const router = express.Router();

// POST /api/auth/register
// Создаёт нового пользователя и пустой аватар
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  // Проверяем, не занят ли логин
  if (await User.findOne({ where: { username } })) {
    return res.status(409).json({ error: 'Username already taken' });
  }
  // Хэшируем пароль
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, password: hash });
  // Создаём запись для аватара этого пользователя
  await Avatar.create({ userId: user.id });
  res.status(201).json({ message: 'User registered' });
});

// POST /api/auth/login
// Проверяет логин/пароль, возвращает JWT
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const user = await User.findOne({ where: { username } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // Сравниваем введённый пароль и хэш из БД
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // Генерируем токен (содержит userId)
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token });
});

module.exports = router;
