const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const Item = require('../models/item');
const ItemUser = require('../models/itemUser');
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

// GET /api/items - возвращает предметы, private-фильтрация по JWT и visible
router.get('/', async (req, res) => {
  try {
    // Определяем userId из JWT, если авторизован
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try { userId = jwt.verify(token, process.env.JWT_SECRET).userId; } catch {}
    }
    // Загружаем все предметы и фильтруем по visible
    let items = await Item.findAll();
    items = items.filter(item => item.visible !== false);
    // Подготовим список доступных private-предметов для userId
    let accessSet = new Set();
    if (userId) {
      const accesses = await ItemUser.findAll({ where: { userId } });
      accessSet = new Set(accesses.map(a => a.itemId));
    }
    // Группируем по категориям
    const grouped = items.reduce((acc, item) => {
      const cat = item.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
    // Фильтруем private-предметы через pivot table
    for (const cat of Object.keys(grouped)) {
      grouped[cat] = grouped[cat].filter(item => {
        if (item.availability !== 'private') return true;
        return accessSet.has(item.id);
      });
    }
    res.json(grouped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/items - добавляет новый предмет, его файлы и миниатюру
router.post('/', upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'files', maxCount: 50 }
]), async (req, res) => {
  console.log('DEBUG POST /api/items body:', req.body);
  console.log('DEBUG POST /api/items files:', req.files);
  try {
    const { category, layer, availability, start, end, users } = req.body;
    // Обрабатываем thumbnail
    const thumbnailFile = req.files.thumbnail && req.files.thumbnail[0]
      ? req.files.thumbnail[0].originalname
      : null;
    // Группируем файлы по ID и цвету из имени
    const colorFiles = req.files.files || [];
    const groups = {};
    colorFiles.forEach(file => {
      const name = file.originalname.replace(/\.png$/i, '');
      const parts = name.split('_');
      // Пропускаем файлы без корректного формата id_hex6
      if (parts.length < 2) return;
      const colorHex = parts.pop();
      if (!/^[0-9A-Fa-f]{6}$/.test(colorHex)) return;
      const id = parts.join('_');
      if (!groups[id]) groups[id] = { id, colors: [] };
      groups[id].colors.push('#' + colorHex);
    });
    // Создаём или обновляем записи в БД и pivot table
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
        colors: groups[id].colors,
        thumbnail: thumbnailFile
      };
      await Item.upsert(itemData);
      const item = await Item.findByPk(id);
      created.push(item);
      // Если private - обновляем pivot таблицу
      if (itemData.availability === 'private' && users) {
        const userIds = users.split(',').map(x=>x.trim()).filter(x=>x);
        await ItemUser.destroy({ where: { itemId: id } });
        for (const uid of userIds) {
          await ItemUser.create({ itemId: id, userId: parseInt(uid) });
        }
      }
    }
    res.status(201).json(created);
  } catch (err) {
    console.error('Ошибка при добавлении предмета:', err);
    // Если это ошибка валидации Sequelize, возвращаем детали
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message);
      return res.status(400).json({ error: 'Validation error', details: messages });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/items/ - удаление предметов без ID (пустой id)
router.delete('/', async (req, res) => {
  try {
    const deletedCount = await Item.destroy({ where: { id: '' } });
    res.json({ message: `Deleted ${deletedCount} items without ID` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/items/:id - удаление предмета
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    // Находим предмет для получения данных о категории, миниатюре и цветах
    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    const category = item.category;
    const thumbnail = item.thumbnail;
    const colors = item.colors || [];

    // Удаляем запись из БД
    await Item.destroy({ where: { id } });

    // Удаляем файлы из файловой системы
    const dir = path.join(__dirname, '..', '..', 'assets', 'сlothes', category);
    try {
      // Удаление миниатюры
      if (thumbnail) {
        const thumbPath = path.join(dir, thumbnail);
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
        }
      }
      // Удаление цветных файлов
      for (const color of colors) {
        const colorHex = color.replace(/^#/, '');
        const fileName = `${id}_${colorHex}.png`;
        const filePath = path.join(dir, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (fsErr) {
      console.error('Ошибка при удалении файлов:', fsErr);
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/items/:id - обновление полей visible и users, pivot table для users
router.patch('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { visible, users } = req.body;
    // Обновляем видимость
    if (typeof visible === 'boolean') {
      await Item.update({ visible }, { where: { id } });
    }
    // Обновляем pivot таблицу для private
    if (typeof users === 'string') {
      const userIds = users.split(',').map(x=>x.trim()).filter(x=>x);
      await ItemUser.destroy({ where: { itemId: id } });
      for (const uid of userIds) {
        await ItemUser.create({ itemId: id, userId: parseInt(uid) });
      }
    }
    res.json({ message: 'Item updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 