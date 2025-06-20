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
      applyToAvatar(category, item.id, defaultColor);
      // г) Рендерим блок глобальных цветов
      renderColorBar(category, item.id, item.colors || []);
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
  categoryList.innerHTML = '';
  categoriesOrder.forEach(category => {
    const items = itemsList[category] || [];
    // Всегда показываем категорию 'body', остальные по настройкам + наличию предметов
    if (category === 'body' || (items.length > 0 && (visibilitySettings[category] !== false))) {
      const li = document.createElement('li');
      li.className = 'category-item';
      li.dataset.category = category;
      // Превью: иконка категории или миниатюра для body
      const img = document.createElement('img');
      img.className = 'category-thumb';
      let src;
      if (category === 'body') {
        if (items.length > 0) {
          const first = items[0];
          if (first.thumbnail) {
            src = `./assets/сlothes/${category}/${first.thumbnail}`;
          } else if (first.colors && first.colors.length > 0) {
            src = `./assets/сlothes/${category}/${first.id}_${first.colors[0].slice(1)}.png`;
          } else {
            src = `./assets/сlothes/${category}/${first.id}.png`;
          }
        } else {
          src = `./assets/icons/categories/${category}.png`;
        }
      } else {
        src = `./assets/icons/categories/${category}.png`;
      }
      img.src = src;
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
    });
    colorBar.appendChild(sw);
  });
}

