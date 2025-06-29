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

// Плавная бесшовная прокрутка списка категорий при удержании кнопок
let catScrollAnim, catScrolling = false;
catUpBtn.addEventListener('mousedown', () => {
  catScrolling = true;
  (function step() {
    if (!catScrolling) return;
    categoryList.scrollBy({ top: -5 });
    catScrollAnim = requestAnimationFrame(step);
  })();
});
['mouseup', 'mouseleave'].forEach(evt =>
  catUpBtn.addEventListener(evt, () => {
    catScrolling = false;
    cancelAnimationFrame(catScrollAnim);
  })
);
catDownBtn.addEventListener('mousedown', () => {
  catScrolling = true;
  (function step() {
    if (!catScrolling) return;
    categoryList.scrollBy({ top: 5 });
    catScrollAnim = requestAnimationFrame(step);
  })();
});
['mouseup', 'mouseleave'].forEach(evt =>
  catDownBtn.addEventListener(evt, () => {
    catScrolling = false;
    cancelAnimationFrame(catScrollAnim);
  })
);

// порядок слоёв (0 – самый задний, 14 – самый передний)
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
  ears:           7,
  headwear:       8,
  shoes:          9,
  pants:          10,
  top:            11,
  dress:          10,  // платье занимает сразу брюки и рубашку
  jumpsuit:       10,  // тоже
  coat:           12,
  accessory:      13, // аксессуары после пальто
  pet:            14
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
const categoriesOrder = [
  'background','body','hair_back','hair_strands','bangs','headwear','tail','eyes','mouth','face_accessory','shoes','pants','top','dress','jumpsuit','coat','accessory','pet'
];
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

function preloadCategoryImages(category) {
  const list = itemsList[category] || [];
  list.forEach(item => {
    if (item.thumbnail) {
      const img = new Image();
      img.src = `./assets/сlothes/${category}/${item.thumbnail}`;
    }
    if (item.colors && item.colors.length > 0) {
      item.colors.forEach(color => {
        const img = new Image();
        img.src = `./assets/сlothes/${category}/${item.id}_${color.slice(1)}.png`;
      });
    } else {
      const img = new Image();
      img.src = `./assets/сlothes/${category}/${item.id}.png`;
    }
  });
}

// Заглушка: подгрузка предметов
// функция подгрузки списка предметов выбранной категории
function loadItems(category) {
  preloadCategoryImages(category);
  inventoryBar.innerHTML = '';
  // Заполняем список предметов
  const now = new Date();
  // Фильтруем с учётом видимости, private-доступа и temporal разблокировки
  let list = (itemsList[category] || []).filter(item => {
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
  // Сортировка: предмет с миниатюрой no_m.png должен быть первым
  list = list.slice().sort((a, b) => {
    if (a.thumbnail === 'no_m.png') return -1;
    if (b.thumbnail === 'no_m.png') return 1;
    return 0;
  });
  list.forEach(item => {
    const div = document.createElement('div');
    div.className = 'inventory-item';
    div.dataset.category = category;
    div.dataset.itemId = item.id;
    // Если это пустой предмет — показываем иконку-заглушку
    if (item.id === category + '_empty') {
      const emptyIcon = document.createElement('div');
      emptyIcon.style.width = '40px';
      emptyIcon.style.height = '40px';
      emptyIcon.style.border = '2px dashed #aaa';
      emptyIcon.style.background = 'repeating-linear-gradient(45deg,#eee,#eee 6px,#ccc 6px,#ccc 12px)';
      emptyIcon.style.position = 'relative';
      // Зачёркнутая линия
      const cross = document.createElement('div');
      cross.style.position = 'absolute';
      cross.style.left = '0';
      cross.style.top = '50%';
      cross.style.width = '100%';
      cross.style.height = '2px';
      cross.style.background = '#d33';
      cross.style.transform = 'rotate(-20deg)';
      emptyIcon.appendChild(cross);
      div.appendChild(emptyIcon);
    } else {
      // Обычный предмет
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
    }
    // Обработчик клика по предмету: применяем предмет и показываем варианты цвета
    div.addEventListener('click', () => {
      inventoryBar.querySelectorAll('.inventory-item').forEach(el => el.classList.remove('selected'));
      div.classList.add('selected');
      if (item.id === category + '_empty') {
        // Снимаем слой с аватара
        const old = avatarCanvas.querySelector(`img[data-category=\"${category}\"]`);
        if (old) avatarCanvas.removeChild(old);
        // Автосохраняем
        saveAvatarConfig(getAvatarConfig());
        // Очищаем цветовую панель
        document.getElementById('color-bar').innerHTML = '';
      } else {
        const defaultColor = item.colors && item.colors.length > 0 ? item.colors[0] : null;
        applyToAvatar(category, item.id, defaultColor, item.availability);
      renderColorBar(category, item.id, item.colors || []);
        if (item.availability === 'temporal') {
        const start = new Date(item.start);
        const end = new Date(item.end);
        if (now >= start && now <= end && !unlockedItems.includes(item.id)) {
          unlockedItems.push(item.id);
          saveUnlockedItems();
          }
        }
        saveAvatarConfig(getAvatarConfig());
        if (category === 'tail') {
          // ищем ушки-пару
          const tailBase = item.id.replace(/_tail(_|$)/, '_ears$1');
          const earsList = itemsList.ears || [];
          // ищем ушки с тем же base-name и цветом
          let earsItem = null;
          if (item.colors && item.colors.length > 0) {
            // ищем по цвету
            earsItem = earsList.find(e => e.id === tailBase && JSON.stringify(e.colors) === JSON.stringify(item.colors));
            // если не нашли по цвету, ищем просто по id
            if (!earsItem) earsItem = earsList.find(e => e.id === tailBase);
          } else {
            earsItem = earsList.find(e => e.id === tailBase);
          }
          if (earsItem) {
            const defaultColor = item.colors && item.colors.length > 0 ? item.colors[0] : null;
            applyToAvatar('ears', earsItem.id, defaultColor, earsItem.availability);
          } else {
            // если ушек нет — удаляем старые ушки
            const oldEars = avatarCanvas.querySelector('img[data-category="ears"]');
            if (oldEars) avatarCanvas.removeChild(oldEars);
          }
        }
      }
    });
    inventoryBar.appendChild(div);
  });

  // Сброс состояния карусели после загрузки новых предметов
  inventoryBar.style.transition = 'none';
  inventoryBar.style.transform = 'none';
  isAnimating = false;
  actionQueue.length = 0;
  // Показать или скрыть кнопки прокрутки только при переполнении
  const wrapper = document.getElementById('inventory-wrapper');
  if (inventoryBar.scrollWidth > wrapper.clientWidth) {
    invPrevBtn.style.display = '';
    invNextBtn.style.display = '';
  } else {
    invPrevBtn.style.display = 'none';
    invNextBtn.style.display = 'none';
  }
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
    // Категорию 'ears' не показываем детям
    if (category === 'ears') return;
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
  // По умолчанию показываем категорию 'body' и открываем соответствующий предмет
  const defaultLi = categoryList.querySelector('li[data-category="body"]');
  if (defaultLi) {
    // Подсветим категорию
    categoryList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
    defaultLi.classList.add('selected');
    // Загружаем предметы категории body
  loadItems('body');
    // Если есть сохранённый элемент body, выберем его, иначе первый
    const savedBody = avatarConfig.find(c => c.category === 'body');
    let targetItem = null;
    if (savedBody) {
      targetItem = inventoryBar.querySelector(`.inventory-item[data-item-id="${savedBody.itemId}"]`);
    }
    if (!targetItem) {
      targetItem = inventoryBar.querySelector('.inventory-item');
    }
    if (targetItem) targetItem.click();
  }
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
  // Показать или скрыть кнопки прокрутки цвета при переполнении
  const prevBtn = document.getElementById('color-prev');
  const nextBtn = document.getElementById('color-next');
  if (colorBar.scrollWidth > colorBar.clientWidth) {
    prevBtn.style.display = '';
    nextBtn.style.display = '';
  } else {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
  }
}

// Отображаем имя пользователя
const usernameDisplay = document.getElementById('username-display');
if (usernameDisplay) {
  usernameDisplay.textContent = localStorage.getItem('currentUsername') || '';
}

const invPrevBtn = document.getElementById('inv-prev');
const invNextBtn = document.getElementById('inv-next');

// Экономный transform-основанный метод циклической прокрутки карусели с очередью действий
let isAnimating = false;
const actionQueue = [];
function schedule(action) {
  actionQueue.push(action);
  if (!isAnimating) processQueue();
}
function processQueue() {
  if (actionQueue.length === 0) return;
  const action = actionQueue.shift();
  if (action === 'next') moveNext(); else movePrev();
}
const gap = parseFloat(getComputedStyle(inventoryBar).columnGap) || 0;

// Функция для перехода вперед
function moveNext() {
  isAnimating = true;
  const first = inventoryBar.firstElementChild;
  const shift = first.getBoundingClientRect().width + gap;
  inventoryBar.style.transition = 'transform 0.25s ease-out';
  inventoryBar.style.transform = `translateX(-${shift}px)`;
  inventoryBar.addEventListener('transitionend', function handler() {
    inventoryBar.style.transition = 'none';
    inventoryBar.style.transform = 'none';
    inventoryBar.appendChild(first);
    inventoryBar.removeEventListener('transitionend', handler);
    isAnimating = false;
    processQueue();
  }, { once: true });
}

// Функция для перехода назад
function movePrev() {
  isAnimating = true;
  const last = inventoryBar.lastElementChild;
  const shift = last.getBoundingClientRect().width + gap;
  // Перемещаем последний элемент вперёд без анимации
  inventoryBar.insertBefore(last, inventoryBar.firstElementChild);
  inventoryBar.style.transition = 'none';
  inventoryBar.style.transform = `translateX(-${shift}px)`;
  // Принудительный reflow для корректного применения начального transform
  void inventoryBar.offsetWidth;
  // Включаем анимацию и возвращаемся в нулевую позицию
  inventoryBar.style.transition = 'transform 0.25s ease-out';
  inventoryBar.style.transform = 'translateX(0)';
  // Обработчик завершения анимации
  inventoryBar.addEventListener('transitionend', function handler() {
    inventoryBar.style.transition = 'none';
    isAnimating = false;
    processQueue();
  }, { once: true });
}

// Обработчики click и wheel через очередь
invPrevBtn.addEventListener('click', () => schedule('prev'));
invNextBtn.addEventListener('click', () => schedule('next'));
inventoryBar.addEventListener('wheel', (e) => {
  e.preventDefault();
  const action = e.deltaY > 0 ? 'next' : 'prev';
  schedule(action);
});

// Добавляем циклическую прокрутку для категорий
const catPrevBtn = document.getElementById('cat-up');
const catNextBtn = document.getElementById('cat-down');
let catAnimating = false;
const catQueue = [];
function scheduleCat(action) {
  catQueue.push(action);
  if (!catAnimating) processCatCat();
}
function processCatCat() {
  if (catQueue.length === 0) return;
  const action = catQueue.shift();
  if (action === 'next') moveCatNext(); else moveCatPrev();
}
const catGap = parseFloat(getComputedStyle(categoryList).gap) || 0;
function moveCatNext() {
  catAnimating = true;
  const first = categoryList.firstElementChild;
  const shift = first.getBoundingClientRect().height + catGap;
  categoryList.style.transition = 'transform 0.25s ease-out';
  categoryList.style.transform = `translateY(-${shift}px)`;
  categoryList.addEventListener('transitionend', function handler() {
    categoryList.style.transition = 'none';
    categoryList.style.transform = 'none';
    categoryList.appendChild(first);
    catAnimating = false;
    processCatCat();
  }, { once: true });
}
function moveCatPrev() {
  catAnimating = true;
  const last = categoryList.lastElementChild;
  const shift = last.getBoundingClientRect().height + catGap;
  categoryList.insertBefore(last, categoryList.firstElementChild);
  categoryList.style.transition = 'none';
  categoryList.style.transform = `translateY(-${shift}px)`;
  // Принудительный reflow
  void categoryList.offsetHeight;
  categoryList.style.transition = 'transform 0.25s ease-out';
  categoryList.style.transform = 'translateY(0)';
  categoryList.addEventListener('transitionend', function handler() {
    categoryList.style.transition = 'none';
    catAnimating = false;
    processCatCat();
  }, { once: true });
}
catPrevBtn.addEventListener('click', () => scheduleCat('prev'));
catNextBtn.addEventListener('click', () => scheduleCat('next'));
categoryList.addEventListener('wheel', (e) => {
  e.preventDefault();
  const action = e.deltaY > 0 ? 'next' : 'prev';
  scheduleCat(action);
});

// Добавляем циклическую прокрутку для блока цветов
const colorPrevBtn = document.getElementById('color-prev');
const colorNextBtn = document.getElementById('color-next');
const colorBar = document.getElementById('color-bar');
let colorAnimating = false;
const colorQueue = [];
function scheduleColor(action) {
  colorQueue.push(action);
  if (!colorAnimating) processColorQueue();
}
function processColorQueue() {
  if (colorQueue.length === 0) return;
  const action = colorQueue.shift();
  if (action === 'next') moveColorNext(); else moveColorPrev();
}
const colorGap = parseFloat(getComputedStyle(colorBar).gap) || 0;
function moveColorNext() {
  colorAnimating = true;
  const first = colorBar.firstElementChild;
  const shift = first.getBoundingClientRect().width + colorGap;
  colorBar.style.transition = 'transform 0.25s ease-out';
  colorBar.style.transform = `translateX(-${shift}px)`;
  colorBar.addEventListener('transitionend', function handler() {
    colorBar.style.transition = 'none';
    colorBar.style.transform = 'none';
    colorBar.appendChild(first);
    colorAnimating = false;
    processColorQueue();
  }, { once: true });
}
function moveColorPrev() {
  colorAnimating = true;
  const last = colorBar.lastElementChild;
  const shift = last.getBoundingClientRect().width + colorGap;
  colorBar.insertBefore(last, colorBar.firstElementChild);
  colorBar.style.transition = 'none';
  colorBar.style.transform = `translateX(-${shift}px)`;
  // Принудительный reflow
  void colorBar.offsetWidth;
  colorBar.style.transition = 'transform 0.25s ease-out';
  colorBar.style.transform = 'translateX(0)';
  colorBar.addEventListener('transitionend', function handler() {
    colorBar.style.transition = 'none';
    colorAnimating = false;
    processColorQueue();
  }, { once: true });
}
colorPrevBtn.addEventListener('click', () => scheduleColor('prev'));
colorNextBtn.addEventListener('click', () => scheduleColor('next'));
colorBar.addEventListener('wheel', (e) => {
  e.preventDefault();
  const action = e.deltaY > 0 ? 'next' : 'prev';
  scheduleColor(action);
});

