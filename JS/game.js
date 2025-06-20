// Получаем элементы
const logoutBtn     = document.getElementById('logout-btn');
const galleryBtn    = document.getElementById('gallery-btn');
const categoryList  = document.getElementById('category-list');
const inventoryBar  = document.getElementById('inventory-bar');
const avatarCanvas  = document.getElementById('avatar-canvas');
const saveBtn       = document.getElementById('save-btn');
const notifications = document.getElementById('notifications');

// FIRST_EDIT: кнопки прокрутки категорий
const catUpBtn = document.getElementById('cat-up');
const catDownBtn = document.getElementById('cat-down');
catUpBtn.addEventListener('click', () => {
  categoryList.scrollBy({ top: -100, behavior: 'smooth' });
});
catDownBtn.addEventListener('click', () => {
  categoryList.scrollBy({ top: 100, behavior: 'smooth' });
});

// порядок слоёв (0 – самый задний, 12 – самый передний)
const layerOrder = {
  background:     0,
  hair_back:      1,
  tail:           2,
  body:           3,
  eyes:           4,
  mouth:          4,
  face_accessory: 4,
  hair_strands:   5,
  bangs:          6,
  headwear:       7,
  shoes:          8,
  pants:          9,
  top:            10,
  dress:          9,  // платье занимает сразу брюки и рубашку
  jumpsuit:       9,  // тоже
  coat:           11,
  accessory:      11, // аксессуары после пальто
  pet:            12
};

// Функция для выполнения GET-запроса
async function fetchData(url) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error('Ошибка загрузки данных');
  return await response.json();
}

// Функция для выполнения POST-запроса
async function postData(url, data) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Ошибка сохранения данных');
  return await response.json();
}

// Получение сохранённой конфигурации аватара
async function fetchAvatarConfig() {
  try {
    return await fetchData('/api/avatar');
  } catch (err) {
    console.error('Не удалось загрузить конфиг аватара:', err);
    return null;
  }
}

// Сохранение конфигурации аватара
async function saveAvatarConfig(config) {
  try {
    await postData('/api/avatar', { config });
    notifications.innerText = 'Конфигурация сохранена!';
    notifications.classList.remove('hidden');
    setTimeout(() => notifications.classList.add('hidden'), 2000);
  } catch (err) {
    console.error('Ошибка сохранения конфига аватара:', err);
  }
}

// Загружаем разблокированные временные предметы из localStorage
let unlockedItems = [];
fetchData('/api/unlockedItems').then(data => {
  unlockedItems = data;
}).catch(console.error);

// Статический список предметов по категориям (default)
const defaultItemsList = {
  background: [],
  hair_back: [
    { id: 'hair1', colors: ['#000000', '#555555', '#aaaaaa'], availability: 'public' },
    { id: 'hair2', colors: ['#a52a2a', '#ffcc00', '#ff66cc'], availability: 'public' }
  ],
  tail: [],
  body: [
    { id: 'skin_light', colors: [], availability: 'public' },
    { id: 'skin_medium', colors: [], availability: 'public' },
    { id: 'skin_dark', colors: [], availability: 'public' }
  ],
  eyes: [],
  mouth: [],
  face_accessory: [],
  hair_strands: [],
  bangs: [],
  headwear: [],
  shoes: [],
  pants: [
    { id: 'bottom1', colors: ['#333333', '#dddddd'], availability: 'public' }
  ],
  top: [
    { id: 'top1', colors: ['#ff0000', '#00ff00'], availability: 'public' },
    { id: 'top2', colors: ['#0000ff', '#00ffff'], availability: 'public' }
  ],
  dress: [],
  jumpsuit: [],
  coat: [],
  accessory: [
    { id: 'acc1', colors: ['#ffff00', '#ff00ff'], availability: 'public' }
  ],
  pet: []
};

// Динамический список предметов из localStorage
const categoriesOrder = ['background','body','hair_back','hair_strands','bangs','headwear','tail','eyes','mouth','face_accessory','shoes','pants','top','dress','jumpsuit','coat','accessory','pet'];
let itemsList = {};

function loadItemsList() {
  return fetchData('/api/items').then(data => {
    itemsList = data;
    console.log('Загруженные данные:', itemsList); // Отладка данных
  }).catch(console.error);
}

// 1. Logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
});

// 2. Выбор категории
categoryList.addEventListener('click', e => {
  // Определяем li.category-item, на который кликнули
  const li = e.target.closest('li.category-item');
  if (li && categoryList.contains(li)) {
    // Подсветить выбранную категорию
    categoryList.querySelectorAll('li').forEach(item => item.classList.remove('selected'));
    li.classList.add('selected');
    // Загрузить предметы
    const category = li.dataset.category;
    loadItems(category);
  }
});

// Заглушка: подгрузка предметов
// функция подгрузки списка предметов выбранной категории
function loadItems(category) {
  inventoryBar.innerHTML = '';           // очищаем панель
  const now = new Date();
  // Фильтруем по availability + разблокированным
  const list = (itemsList[category] || []).filter(item => {
    if (item.availability === 'public') return true;
    if (item.availability === 'time-limited') {
      const start = new Date(item.start);
      const end = new Date(item.end);
      if (now >= start && now <= end) return true;
      return unlockedItems.includes(item.id);
    }
    if (item.availability === 'private') {
      const users = item.users?.split(',') || [];
      const currentUser = localStorage.getItem('currentUser');
      return users.includes(currentUser);
    }
    return false;
  });

  list.forEach(item => {
    // 3. Создаём контейнер <div> для одного предмета
    const div = document.createElement('div');
    div.className = 'inventory-item';
    div.dataset.category = category;
    div.dataset.itemId   = item.id;

    // 4. Показываем картинку только если нет вариантов цвета
    let imgEl = null;
    if (!item.colors || item.colors.length === 0) {
      imgEl = document.createElement('img');
      imgEl.src = `./assets/сlothes/${category}/${item.id}.png`;
      div.appendChild(imgEl);
    }

    // 5. Блок для цветовых вариантов
    let colorsDiv = null;
    if (item.colors && item.colors.length > 0) {
      colorsDiv = document.createElement('div');
      colorsDiv.className = 'color-options';

      // 6. Перебираем все цвета для этого предмета
      item.colors.forEach(color => {
        const swatch = document.createElement('span');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.dataset.color = color;

        // 7. Обработчик клика по кругу цвета
        swatch.addEventListener('click', e => {
          e.stopPropagation();
          // 8. Снимаем выделение со всех кругов внутри этого colorsDiv
          if (colorsDiv) colorsDiv.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
          // 9. Отмечаем кликнутый круг
          swatch.classList.add('selected');
          // 10. Применяем визуальный фильтр к иконке предмета (если есть)
          if (imgEl) imgEl.style.filter = `drop-shadow(0 0 0 ${color})`;
        });

        // Добавляем кружок цвета
        colorsDiv.appendChild(swatch);
      });

      // Добавляем блок цветов
      div.appendChild(colorsDiv);
    }

    // 11. Обработчик клика по самому предмету
    div.addEventListener('click', () => {
      // а) Снимаем класс selected у всех предметов
      inventoryBar.querySelectorAll('.inventory-item').forEach(el => el.classList.remove('selected'));
      // б) Отмечаем текущий предмет
      div.classList.add('selected');
      // в) Определяем выбранный цвет, если есть
      let color = null;
      if (colorsDiv) {
        const sw = colorsDiv.querySelector('.color-swatch.selected');
        color = sw?.dataset.color || null;
      }
      // г) Вызываем функцию нанесения предмета на аватар
      applyToAvatar(category, item.id, color);
      // Сохраняем разблокированный временный предмет
      if (item.availability === 'time-limited') {
        const start = new Date(item.start);
        const end = new Date(item.end);
        if (now >= start && now <= end && !unlockedItems.includes(item.id)) {
          unlockedItems.push(item.id);
          saveUnlockedItems();
        }
      }
    });

    // 12. Добавляем готовый div в панель inventoryBar
    inventoryBar.appendChild(div);
  });
}


// 3. Отрисовка аватара (пустой)
function renderAvatar() {
  // Очищаем canvas без плейсхолдера
  avatarCanvas.innerHTML = '';
}

// 4. Сохранение образа
saveBtn.addEventListener('click', () => {
  // Сохраняем текущую конфигурацию аватара на сервере
  const config = Array.from(avatarCanvas.querySelectorAll('img[data-layer]')).map(el => ({
    category: el.dataset.category,
    itemId: el.dataset.itemId,
    color: el.dataset.color || null
  }));
  saveAvatarConfig(config);
});

// Функция генерации списка категорий с превью
function renderCategoryList() {
  // Читаем настройки видимости категорий из localStorage
  const visibilitySettings = JSON.parse(localStorage.getItem('categoriesVisibility') || '{}');
  // Список категорий, которые пока пусты и не должны отображаться
  const hideEmpty = ['hair_back','pants','top','accessory'];
  categoryList.innerHTML = '';  // очищаем старые элементы
  categoriesOrder.forEach(category => {
    // Пропускаем явно пустые категории и те без предметов
    const items = itemsList[category] || [];
    if (visibilitySettings[category] && items.length > 0 && !hideEmpty.includes(category)) {
      const li = document.createElement('li');
      li.className = 'category-item';
      li.dataset.category = category;
      // Превью: иконка категории
      const img = document.createElement('img');
      img.className = 'category-thumb';
      img.src = `./assets/icons/categories/${category}.png`;
      img.alt = category;
      // Удаляем категорию, если иконка не загрузилась
      img.addEventListener('error', () => {
        li.remove();
      });
      li.appendChild(img);
      // Добавляем подпись категории
      const label = document.createElement('span');
      label.className = 'category-label';
      label.textContent = category[0].toUpperCase() + category.slice(1);
      li.appendChild(label);
      // Добавляем в список
      categoryList.appendChild(li);
    }
  });
}

// Инициализация страницы
(async function init() {
  await loadItemsList();
  // Загружаем и применяем сохранённый конфиг аватара
  const avatarConfig = await fetchAvatarConfig();
  if (Array.isArray(avatarConfig)) {
    renderAvatar();
    avatarConfig.forEach(({category, itemId, color}) => applyToAvatar(category, itemId, color));
  } else {
    renderAvatar();
  }
  console.log('Элемент categoryList:', categoryList);
  // Генерируем категории
  renderCategoryList();
  // Подсветка и загрузка дефолтной категории "Кожа"
  document.querySelectorAll('.category-item').forEach(li => li.classList.remove('selected'));
  const defaultCat = categoryList.querySelector(`.category-item[data-category="body"]`);
  if (defaultCat) defaultCat.classList.add('selected');
  // Загружаем предметы и выделяем дефолтный
  loadItems('body');
  const defaultItem = inventoryBar.querySelector('.inventory-item[data-item-id="skin_light"]');
  if (defaultItem) defaultItem.classList.add('selected');
  applyToAvatar('body', 'skin_light', null);
})();

// Накладываем выбранный предмет на канвас
function applyToAvatar(category, itemId, color) {
  // Удаляем старый элемент этой категории
  const old = avatarCanvas.querySelector(`img[data-category=\"${category}\"]`);
  if (old) avatarCanvas.removeChild(old);

  // 2. Создаём новый слой
  const el = document.createElement('img');
  // При загрузке изображения устанавливаем aspect-ratio контейнера
  el.addEventListener('load', () => {
    const w = el.naturalWidth;
    const h = el.naturalHeight;
    avatarCanvas.style.aspectRatio = `${w} / ${h}`;
  });
  el.src = `./assets/сlothes/${category}/${itemId}.png`;
  
  // 3. Указываем z-index на основании общего порядка слоёв
  const z = layerOrder[category] ?? 0;
  el.style.zIndex = z;

  // Помечаем категорию в data-атрибуте
  el.dataset.category = category;
  // 4. Помечаем слой в data-атрибуте, чтобы можно было удалить потом
  el.dataset.layer = z;

  // 5. Применяем цвет, если указан
  if (color) {
    el.style.filter = `drop-shadow(0 0 0 ${color})`;
  }

  // Сохраняем данные для постройки конфига
  el.dataset.itemId = itemId;
  el.dataset.color = color || '';

  // 6. Добавляем в canvas
  avatarCanvas.appendChild(el);
}

// Заменяем сохранение разблокированных предметов
function saveUnlockedItems() {
  postData('/api/unlockedItems', unlockedItems).catch(console.error);
}

