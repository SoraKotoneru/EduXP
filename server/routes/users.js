const express = require('express');
const router = express.Router();
const User = require('../models/user');

// GET /api/users - возвращает всех пользователей (ID и username)
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'username'] });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 