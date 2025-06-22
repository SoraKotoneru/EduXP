const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// GET /api/body-variants - список файлов тел
router.get('/api/body-variants', (req, res) => {
  const dir = path.join(__dirname, '../../assets/сlothes/body');
  fs.readdir(dir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Не удалось получить варианты тел' });
    // Оставляем только .png
    const variants = files.filter(f => f.endsWith('.png'));
    res.json(variants);
  });
});

module.exports = router; 