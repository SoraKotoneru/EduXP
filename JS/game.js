// Получаем элементы
const logoutBtn     = document.getElementById('logout-btn');
const galleryBtn    = document.getElementById('gallery-btn');
const categoryList  = document.getElementById('category-list');
const inventoryBar  = document.getElementById('inventory-bar');
const avatarCanvas  = document.getElementById('avatar-canvas');
const saveBtn       = document.getElementById('save-btn');
const resetBtn      = document.getElementById('reset-btn');
const notifications = document.getElementById('notifications');

// ——— ЗАГЛУШКА: список всех предметов и их доступных цветов ———
const itemsList = {
  hair: [
    { id: 'hair1', colors: ['#000000', '#555555', '#aaaaaa'] },
    { id: 'hair2', colors: ['#a52a2a', '#ffcc00', '#ff66cc'] }
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
    div.className = 'inventory-item';     // класс для CSS-оформления
    div.dataset.category = category;      // сохраняем категорию в data-атрибут
    div.dataset.itemId   = item.id;       // сохраняем ID предмета

    // 4. Создаём иконку <img>
    const img = document.createElement('img');
    img.src = `assets/clothes/${category}/${item.id}.png`; // путь к картинке
    div.appendChild(img);

    // 5. Блок для цветовых вариантов
    const colorsDiv = document.createElement('div');
    colorsDiv.className = 'color-options';

    // 6. Перебираем все цвета для этого предмета
    item.colors.forEach(color => {
      const swatch = document.createElement('span');
      swatch.className = 'color-swatch';     // класс для круга цвета
      swatch.style.backgroundColor = color;  // задаём цвет фона круга
      swatch.dataset.color = color;          // сохраняем цвет в data-атрибут

      // 7. Обработчик клика по кругу цвета
      swatch.addEventListener('click', e => {
        e.stopPropagation(); // предотвращаем выбор самого предмета
        // 8. Снимаем выделение со всех кругов внутри этого colorsDiv
        colorsDiv.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        // 9. Отмечаем кликнутый круг
        swatch.classList.add('selected');
        // 10. Применяем визуальный фильтр к иконке предмета (для наглядности)
        img.style.filter = `drop-shadow(0 0 0 ${color})`;
      });

      colorsDiv.appendChild(swatch);
    });

    div.appendChild(colorsDiv);

    // 11. Обработчик клика по самому предмету
    div.addEventListener('click', () => {
      // а) Снимаем класс selected у всех предметов
      inventoryBar.querySelectorAll('.inventory-item').forEach(el => el.classList.remove('selected'));
      // б) Отмечаем текущий предмет
      div.classList.add('selected');
      // в) Находим выбранный цвет, если есть
      const sw = colorsDiv.querySelector('.color-swatch.selected');
      const color = sw?.dataset.color || null;
      // г) Вызываем функцию нанесения предмета на аватар
      applyToAvatar(category, item.id, color);
    });

    // 12. Добавляем готовый div в панель inventoryBar
    inventoryBar.appendChild(div);
  });
}


// 3. Отрисовка аватара (пустой)
function renderAvatar() {
  avatarCanvas.innerHTML = '<p>Аватар появится здесь</p>';
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
  loadItems('hair');  // теперь показывает предметы и панели цветов
})();

// Накладываем выбранный предмет на канвас
function applyToAvatar(category, itemId, color) {
  // удаляем старый элемент этого категории
  const old = avatarCanvas.querySelector(`img[data-category="${category}"]`);
  if (old) avatarCanvas.removeChild(old);

  // создаём новый
  const el = document.createElement('img');
  el.src = `assets/clothes/${category}/${itemId}.png`;
  el.dataset.category = category;
  el.style.position = 'absolute';
  el.style.top = '0';
  el.style.left = '0';
  el.style.width = '100%';
  el.style.height = '100%';
  if (color) {
    // простой цветовой фильтр (можно заменить на сложную перекраску)
    el.style.filter = `drop-shadow(0 0 0 ${color})`;
  }
  avatarCanvas.appendChild(el);
}
