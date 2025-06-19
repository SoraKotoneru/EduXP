// Получаем элементы
const logoutBtn     = document.getElementById('logout-btn');
const galleryBtn    = document.getElementById('gallery-btn');
const categoryList  = document.getElementById('category-list');
const inventoryBar  = document.getElementById('inventory-bar');
const avatarCanvas  = document.getElementById('avatar-canvas');
const saveBtn       = document.getElementById('save-btn');
const resetBtn      = document.getElementById('reset-btn');
const notifications = document.getElementById('notifications');

// порядок слоёв (0 – самый задний, 12 – самый передний)
const layerOrder = {
  background:     0,
  hair_back:      1,
  tail:           2,
  body:           3,
  face:           4,
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


// ——— ЗАГЛУШКА: список всех предметов и их доступных цветов ———
const itemsList = {
  hair: [
    { id: 'hair1', colors: ['#000000', '#555555', '#aaaaaa'] },
    { id: 'hair2', colors: ['#a52a2a', '#ffcc00', '#ff66cc'] }
  ],
  body: [
    { id: 'skin_light', colors: [] },
    { id: 'skin_medium', colors: [] },
    { id: 'skin_dark', colors: [] }
  ],
  top: [
    { id: 'top1', colors: ['#ff0000', '#00ff00'] },
    { id: 'top2', colors: ['#0000ff', '#00ffff'] }
  ],
  bottom: [
    { id: 'bottom1', colors: ['#333333', '#dddddd'] }
  ],
  accessory: [
    { id: 'acc1', colors: ['#ffff00', '#ff00ff'] }
  ]
};


// 1. Logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
});

// 2. Выбор категории
categoryList.addEventListener('click', e => {
  if (e.target.tagName === 'LI') {
    // Подсветить выбранную категорию
    categoryList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
    e.target.classList.add('selected');
    // Загрузить предметы
    const category = e.target.dataset.category;
    loadItems(category);
  }
});

// Заглушка: подгрузка предметов
// функция подгрузки списка предметов выбранной категории
function loadItems(category) {
  inventoryBar.innerHTML = '';           // 1. Очищаем панель перед вставкой новых иконок
  const list = itemsList[category] || []; // 2. Берём из объекта itemsList массив предметов по ключу category

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
  notifications.innerText = 'Образ сохранён!';
  notifications.classList.remove('hidden');
  setTimeout(() => notifications.classList.add('hidden'), 2000);
  // TODO: сохранить config в localStorage или на сервер
});

// 5. Сброс образа
resetBtn.addEventListener('click', () => {
  renderAvatar();
});

// Инициализация страницы
(function init() {
  renderAvatar();
  // Выбираем категорию "Кожа" по умолчанию
  categoryList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
  const defaultCat = categoryList.querySelector('li[data-category="body"]');
  if (defaultCat) defaultCat.classList.add('selected');
  // Загружаем предметы
  loadItems('body');
  // Подсветка дефолтного скина
  const defaultItem = inventoryBar.querySelector('.inventory-item[data-item-id="skin_light"]');
  if (defaultItem) defaultItem.classList.add('selected');
  // Накладываем дефолтный скин
  applyToAvatar('body', 'skin_light', null);
})();

// Накладываем выбранный предмет на канвас
function applyToAvatar(category, itemId, color) {
  // 1. Удаляем старый элемент этого же слоя
  const old = avatarCanvas.querySelector(`img[data-layer="${layerOrder[category]}"]`);
  if (old) avatarCanvas.removeChild(old);

  // 2. Создаём новый слой
  const el = document.createElement('img');
  el.src = `./assets/сlothes/${category}/${itemId}.png`;
  
  // 3. Указываем z-index на основании общего порядка слоёв
  const z = layerOrder[category] ?? 0;
  el.style.zIndex = z;

  // 4. Помечаем слой в data-атрибуте, чтобы можно было удалить потом
  el.dataset.layer = z;

  // 5. Применяем цвет, если указан
  if (color) {
    el.style.filter = `drop-shadow(0 0 0 ${color})`;
  }

  // 6. Добавляем в canvas
  avatarCanvas.appendChild(el);
}

