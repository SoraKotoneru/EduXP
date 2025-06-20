const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Подгружаем статический список предметов из JSON-файла
// const itemsFile = path.join(__dirname, '..', 'data', 'clothes.json'); // не используется
const defaultItemsList = require(path.join(__dirname, '..', '..', 'data', 'clothes.json'));
// Путь до папки с ассетами одежды
const assetsPath = path.join(__dirname, '..', '..', 'assets', 'сlothes');
// Определяем, какие категории реально есть в папке assets/сlothes
const categoriesInAssets = fs.existsSync(assetsPath)
  ? fs.readdirSync(assetsPath).filter(name => fs.statSync(path.join(assetsPath, name)).isDirectory())
  : [];

// GET /api/items
router.get('/', (req, res) => {
  // Отдаём только те категории, для которых есть ассеты
  const filtered = {};
  categoriesInAssets.forEach(cat => {
    if (defaultItemsList[cat] && defaultItemsList[cat].length > 0) {
      filtered[cat] = defaultItemsList[cat];
    }
  });
  res.json(filtered);
});

module.exports = router; 