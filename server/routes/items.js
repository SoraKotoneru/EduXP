const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Item = require('../models/item');
const router = express.Router();

// Multer: сохраняем файлы в assets/сlothes/<category>
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category;
    const dir = path.join(__dirname, '..', '..', 'assets', 'сlothes', category);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// GET /api/items - возвращает все предметы, сгруппированные по категории
router.get('/', async (req, res) => {
  try {
    const items = await Item.findAll();
    const grouped = items.reduce((acc, item) => {
      const cat = item.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
    res.json(grouped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/items - добавляет новый предмет и его файлы
router.post('/', upload.array('files'), async (req, res) => {
  try {
    const { category, layer, availability, start, end, users } = req.body;
    // Группируем файлы по ID и цвету из имени
    const groups = {};
    req.files.forEach(file => {
      const name = file.originalname.replace(/\.png$/i, '');
      const parts = name.split('_');
      const colorHex = parts.pop();
      const id = parts.join('_');
      if (!groups[id]) groups[id] = { id, colors: [] };
      groups[id].colors.push('#' + colorHex);
    });
    // Создаём записи в БД
    const created = [];
    for (const id in groups) {
      const itemData = {
        id,
        category,
        layer: parseInt(layer),
        availability,
        start: start || null,
        end: end || null,
        users: users || null,
        colors: groups[id].colors
      };
      const item = await Item.create(itemData);
      created.push(item);
    }
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/items/:id - удаление предмета
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await Item.destroy({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 