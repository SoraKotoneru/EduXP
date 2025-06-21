// Проверяем авторизацию и перенаправляем на страницу входа, если нет токена
if (!localStorage.getItem('token')) {
  window.location.href = 'index.html';
}

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

// Список public/temporal/time-limited предметов, которые пользователь сохранил в образе
let savedConfig = [];
let savedItems = [];
let unlockedItems = [];

// Функция для выполнения GET-запроса
async function fetchData(url) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(url, { headers, cache: 'no-store' });
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
    cache: 'no-store',
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
    // Обновляем локальный сохранённый конфиг и список сохранённых itemId
    savedConfig = config;
    savedItems = config.map(c => c.itemId);
    notifications.innerText = 'Конфигурация сохранена!';
    notifications.classList.remove('hidden');
    setTimeout(() => notifications.classList.add('hidden'), 2000);
  } catch (err) {
    console.error('Ошибка сохранения конфига аватара:', err);
  }
}

// Функция для получения текущей конфигурации аватара из канваса (с availability)
function getAvatarConfig() {
  return Array.from(avatarCanvas.querySelectorAll('img[data-layer]')).map(el => {
    return {
      category: el.dataset.category,
      itemId: el.dataset.itemId,
      color: el.dataset.color || null,
      availability: el.dataset.availability || 'public'
    };
  });
}

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
    // Добавим дефолтные элементы body, если их нет в базе
    if (!itemsList.body || itemsList.body.length === 0) {
      itemsList.body = defaultItemsList.body.map(item => ({
        id: item.id,
        colors: item.colors,
        availability: item.availability,
        // дефолтная миниатюра равна базовому PNG
        thumbnail: `${item.id}.png`
      }));
    }
    console.log('Загруженные данные:', itemsList); // Отладка данных
  }).catch(console.error);
}

// 1. Logout: сохраняем аватар перед выходом
logoutBtn.addEventListener('click', () => {
  const config = getAvatarConfig();
  saveAvatarConfig(config)
    .catch(err => console.error('Ошибка автосохранения перед выходом:', err))
    .finally(() => {
      localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUsername');
  window.location.href = 'index.html';
    });
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
  // Фильтруем с учётом видимости, private-доступа и temporal разблокировки
  const list = (itemsList[category] || []).filter(item => {
    const currentUser = localStorage.getItem('currentUser');
    // показываем все сохранённые предметы
    if (savedItems.includes(item.id)) return true;
    // админ видит всё
    if (document.cookie.includes('adminAuth=')) return true;
    // скрытые предметы
    if (item.visible === false) {
      // private-доступ
      if (item.availability === 'private') {
        const users = item.users ? item.users.split(',').map(u => u.trim()) : [];
        if (users.includes(currentUser)) return true;
      }
      // разблокированные temporal/time-limited
      if ((item.availability === 'temporal' || item.availability === 'time-limited') && unlockedItems.includes(item.id)) return true;
      return false;
    }
    // видимые предметы
    if (item.availability === 'public' || item.availability === 'temporal' || item.availability === 'time-limited') return true;
    if (item.availability === 'private') {
      const users = item.users ? item.users.split(',').map(u => u.trim()) : [];
      return users.includes(currentUser);
    }
    return false;
  });

  list.forEach(item => {
    // 3. Создаём контейнер <div> для одного предмета
    const div = document.createElement('div');
    div.className = 'inventory-item';
    div.dataset.category = category;
    div.dataset.itemId = item.id;

    // 4. Показываем превью предмета (миниатюра или первая вариация или базовый файл)
    const imgEl = document.createElement('img');
    const defaultColor = item.colors && item.colors.length > 0 ? item.colors[0] : null;
    let previewSrc;
    if (item.thumbnail) {
      previewSrc = `./assets/сlothes/${category}/${item.thumbnail}`;
    } else if (defaultColor) {
      previewSrc = `./assets/сlothes/${category}/${item.id}_${defaultColor.slice(1)}.png`;
    } else {
      previewSrc = `./assets/сlothes/${category}/${item.id}.png`;
    }
    imgEl.src = previewSrc;
    div.appendChild(imgEl);

    // Обработчик клика по предмету: применяем предмет и показываем варианты цвета
    div.addEventListener('click', () => {
      // a) Снимаем выделение у всех предметов
      inventoryBar.querySelectorAll('.inventory-item').forEach(el => el.classList.remove('selected'));
      // b) Отмечаем текущий предмет
      div.classList.add('selected');
      // в) Наносим на аватар выбранную вариацию
      applyToAvatar(category, item.id, defaultColor, item.availability);
      // г) Рендерим блок глобальных цветов
      renderColorBar(category, item.id, item.colors || []);
      // Сохраняем разблокированный временный предмет
      if (item.availability === 'temporal') {
        const start = new Date(item.start);
        const end = new Date(item.end);
        if (now >= start && now <= end && !unlockedItems.includes(item.id)) {
          unlockedItems.push(item.id);
          saveUnlockedItems();
        }
      }
      // Автосохранение конфигурации после выбора предмета
      saveAvatarConfig(getAvatarConfig());
    });

    // Добавляем предмет в панель
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
  // Сохраняем текущий конфиг (с availability), без удаления temporal скрытых
  saveAvatarConfig(getAvatarConfig());
});

// Функция генерации списка категорий с превью
function renderCategoryList() {
  categoryList.innerHTML = '';
  categoriesOrder.forEach(category => {
    const items = itemsList[category] || [];
    // Показываем категорию, если есть сохранённые элементы, видимые или это тело по умолчанию
    if (category === 'body' || items.length > 0 || savedConfig.some(c => c.category === category)) {
      const li = document.createElement('li');
      li.className = 'category-item';
      li.dataset.category = category;
      // Превью: статическая иконка категории
      const img = document.createElement('img');
      img.className = 'category-thumb';
      img.src = `./assets/icons/categories/${category}.png`;
      img.alt = category;
      li.appendChild(img);
      // Подпись категории
      const label = document.createElement('span');
      label.className = 'category-label';
      label.textContent = category[0].toUpperCase() + category.slice(1);
      li.appendChild(label);
      categoryList.appendChild(li);
    }
  });
}

// Инициализация страницы - рендерим категории и применяем только сохранённые слои
(async function init() {
  // Загружаем сохранённый конфиг аватара и список разблокированных
  let avatarConfig = [];
  try {
    unlockedItems = await fetchData('/api/unlockedItems');
    avatarConfig = await fetchAvatarConfig() || [];
  } catch (err) {
    console.error('Ошибка при инициализации разблокировок и конфига:', err);
  }
  // Сохраняем локальные копии
  savedConfig = avatarConfig;
  savedItems = savedConfig.map(c => c.itemId);
  // Загружаем данные и рендерим категории
  await loadItemsList();
  renderCategoryList();
  renderAvatar();
  // Накладываем все сохранённые слои на холст
  avatarConfig.forEach(({category, itemId, color, availability}) => applyToAvatar(category, itemId, color, availability));
})();

// Накладываем выбранный предмет на канвас
function applyToAvatar(category, itemId, color, availability = 'public') {
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
  // Выбираем нужный файл (вариация цвета или базовый)
  if (color) {
    el.src = `./assets/сlothes/${category}/${itemId}_${color.slice(1)}.png`;
  } else {
    el.src = `./assets/сlothes/${category}/${itemId}.png`;
  }
  // 3. Указываем z-index на основании общего порядка слоёв
  const z = layerOrder[category] ?? 0;
  el.style.zIndex = z;

  // Помечаем категорию и слой в data-атрибутах
  el.dataset.category = category;
  el.dataset.layer = z;
  el.dataset.itemId = itemId;
  // Сохраняем выбранный цвет (hex) если есть
  el.dataset.color = color || '';
  el.dataset.availability = availability;

  // 6. Добавляем в canvas
  avatarCanvas.appendChild(el);
}

// Заменяем сохранение разблокированных предметов
function saveUnlockedItems() {
  postData('/api/unlockedItems', unlockedItems).catch(console.error);
}

// Добавляю функцию рендера блока глобальных цветов
function renderColorBar(category, itemId, colors) {
  const colorBar = document.getElementById('color-bar');
  colorBar.innerHTML = '';
  colors.forEach(color => {
    const sw = document.createElement('span');
    sw.className = 'color-swatch';
    sw.style.backgroundColor = color;
    sw.dataset.color = color;
    sw.addEventListener('click', () => {
      // снимаем выделение
      colorBar.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('selected'));
      sw.classList.add('selected');
      // применяем выбранную вариацию
      applyToAvatar(category, itemId, color);
      // Автосохранение конфигурации после смены цвета
      saveAvatarConfig(getAvatarConfig());
    });
    colorBar.appendChild(sw);
  });
}

// Отображаем имя пользователя
const usernameDisplay = document.getElementById('username-display');
if (usernameDisplay) {
  usernameDisplay.textContent = localStorage.getItem('currentUsername') || '';
}

