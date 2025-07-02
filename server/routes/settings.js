const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const SETTINGS_PATH = path.join(__dirname, '..', 'settings.json');

// GET /api/settings - возвращает настройки приложения
router.get('/', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    res.json(data);
  } catch (e) {
    console.error('Error reading settings:', e);
    res.status(500).json({ error: 'Cannot read settings' });
  }
});

// POST /api/settings - обновляет настройки приложения
router.post('/', express.json(), (req, res) => {
  const allowedKeys = ['galleryEnabled'];
  try {
    const current = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    allowedKeys.forEach(key => {
      if (req.body.hasOwnProperty(key)) {
        current[key] = req.body[key];
      }
    });
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(current, null, 2));
    res.json(current);
  } catch (e) {
    console.error('Error updating settings:', e);
    res.status(500).json({ error: 'Cannot update settings' });
  }
});

module.exports = router; 