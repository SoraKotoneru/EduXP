const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const Item = require('../models/item');
const ItemUser = require('../models/itemUser');
const Avatar = require('../models/avatar');
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

// GET /api/items - возвращает предметы с учётом public, private и temporal доступа
router.get('/', async (req, res) => {
  try {
    // определяем userId из JWT
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try { userId = jwt.verify(token, process.env.JWT_SECRET).userId; } catch {}
    }
    // загружаем все предметы
    let items = await Item.findAll();
    // получаем private-доступ для пользователя
    let accessSet = new Set();
    if (userId) {
      const accesses = await ItemUser.findAll({ where: { userId } });
      accessSet = new Set(accesses.map(a => a.itemId));
    }
    // получаем набор локально разблокированных временных предметов (persisted и сохраненных в конфигах)
    let unlockedSet = new Set();
    if (userId) {
      const avatar = await Avatar.findOne({ where: { userId } });
      if (avatar && avatar.config) {
        // persisted unlocked items from POST /api/unlockedItems
        const persisted = Array.isArray(avatar.config.unlockedItems) ? avatar.config.unlockedItems : [];
        // все сохранённые itemId из avatarConfig (любой availability)
        const saved = Array.isArray(avatar.config.avatarConfig)
          ? avatar.config.avatarConfig.map(c => c.itemId)
          : [];
        // объединяем все
        new Set([...persisted, ...saved]).forEach(id => unlockedSet.add(id));
      }
    }
    // фильтруем предметы по доступности
    items = items.filter(item => {
      // если админ - вернуть всё
      // adminAuth проверяется на фронтенде
      // скрытые предметы можно показать, если они private и в unlockedSet
      if (item.visible === false) {
        return (item.availability === 'private' && accessSet.has(item.id))
          || unlockedSet.has(item.id);
      }
      // public, temporal и time-limited доступны всем
      if (item.availability === 'public' || item.availability === 'temporal' || item.availability === 'time-limited') return true;
      // private - только имеющим доступ
      if (item.availability === 'private') return accessSet.has(item.id);
      return false;
    });
    // группируем по категориям
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

// GET /api/items/all - возвращает все предметы (для административной панели)
router.get('/all', async (req, res) => {
  try {
    const items = await Item.findAll();
    // группируем по категориям
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

    // Удаляем записи из pivot-таблицы (ItemUser) и сам предмет из БД
    await ItemUser.destroy({ where: { itemId: id } });
    await Item.destroy({ where: { id } });

    // Удаляем все файлы предмета из системы
    const dir = path.join(__dirname, '..', '..', 'assets', 'сlothes', category);
    try {
      if (fs.existsSync(dir)) {
        const filesInDir = fs.readdirSync(dir);
        filesInDir.forEach(file => {
          // удаляем файл, если он thumbnail или имя начинается с id_ или совпадает с id.png
          if (file === thumbnail || file.startsWith(`${id}_`) || file === `${id}.png`) {
            const filePath = path.join(dir, file);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          }
        });
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
    // Обновляем список пользователей и pivot таблицу для private
    if (typeof users === 'string') {
      // Сохраняем строку users в таблице Item
      await Item.update({ users }, { where: { id } });
      // Обновляем записи в pivot таблице
      const userIds = users.split(',').map(x => x.trim()).filter(x => x);
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