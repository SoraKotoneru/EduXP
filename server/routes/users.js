const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Avatar = require('../models/avatar');

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

// DELETE /api/users/:id - удаляет пользователя и его аватар
router.delete('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    // Удаляем аватар пользователя
    await Avatar.destroy({ where: { userId } });
    // Удаляем пользователя
    const deleted = await User.destroy({ where: { id: userId } });
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 