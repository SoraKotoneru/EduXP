const express = require('express');
const jwt = require('jsonwebtoken');
const Avatar = require('../models/avatar');
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

// GET /api/unlockedItems
router.get('/', async (req, res) => {
  try {
    const avatar = await Avatar.findOne({ where: { userId: req.userId } });
    const unlocked = avatar.config.unlockedItems || [];
    res.json(unlocked);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/unlockedItems
router.post('/', async (req, res) => {
  const unlockedItems = req.body;
  if (!Array.isArray(unlockedItems)) {
    return res.status(400).json({ error: 'Unlocked items list required' });
  }
  try {
    const avatar = await Avatar.findOne({ where: { userId: req.userId } });
    avatar.config = { ...avatar.config, unlockedItems };
    await avatar.save();
    res.json(unlockedItems);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 