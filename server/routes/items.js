const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Подгружаем статический список предметов из JSON-файла
// const itemsFile = path.join(__dirname, '..', 'data', 'clothes.json'); // не используется
const defaultItemsList = require(path.join(__dirname, '..', '..', 'data', 'clothes.json'));
// Путь до папки с ассетами одежды
const assetsPath = path.join(__dirname, '..', '..', 'assets', 'сlothes');
// Определяем категории, где есть хотя бы один PNG-файл в папке ассетов
const categoriesInAssets = fs.existsSync(assetsPath)
  ? fs.readdirSync(assetsPath).filter(name => {
      const catDir = path.join(assetsPath, name);
      if (!fs.statSync(catDir).isDirectory()) return false;
      const files = fs.readdirSync(catDir).filter(f => f.toLowerCase().endsWith('.png'));
      return files.length > 0;
    })
  : [];

// GET /api/items
router.get('/', (req, res) => {
  // Отдаём только те категории, для которых есть и дефолтные предметы, и реальные PNG-файлы ассетов
  const filtered = categoriesInAssets.reduce((acc, cat) => {
    if (defaultItemsList[cat] && defaultItemsList[cat].length > 0) {
      acc[cat] = defaultItemsList[cat];
    }
    return acc;
  }, {});
  res.json(filtered);
});

module.exports = router; 