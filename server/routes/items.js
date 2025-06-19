const express = require('express');
const path = require('path');
const router = express.Router();

// Подгружаем статический список предметов из JSON-файла
const itemsFile = path.join(__dirname, '..', 'data', 'clothes.json');
const defaultItemsList = require('../data/clothes.json');

// GET /api/items
router.get('/', (req, res) => {
  res.json(defaultItemsList);
});

module.exports = router; 