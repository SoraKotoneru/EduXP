document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('item-form');
  const availability = document.getElementById('item-availability');
  const settings = document.getElementById('availability-settings');

  // Показываем дополнительные поля для настройки доступности
  availability.addEventListener('change', () => {
    settings.innerHTML = '';
    if (availability.value === 'time-limited') {
      settings.innerHTML = `
        <label for="start-date">Начало (дд.мм.гггг):</label>
        <input type="date" id="start-date">
        <label for="end-date">Конец (дд.мм.гггг):</label>
        <input type="date" id="end-date">
      `;
    } else if (availability.value === 'private') {
      settings.innerHTML = `
        <label for="user-list">Пользователи (ID через запятую):</label>
        <input type="text" id="user-list" placeholder="user1,user2">
      `;
    }
  });

  // Загружаем существующие предметы из localStorage
  function renderItemsList() {
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    const tbody = document.querySelector('#items-table tbody');
    tbody.innerHTML = '';
    items.forEach(item => {
      const tr = document.createElement('tr');
      // ID
      const tdId = document.createElement('td'); tdId.textContent = item.id; tr.appendChild(tdId);
      // Категория
      const tdCat = document.createElement('td'); tdCat.textContent = item.category; tr.appendChild(tdCat);
      // Слой
      const tdLayer = document.createElement('td'); tdLayer.textContent = item.layer; tr.appendChild(tdLayer);
      // Цвет
      const tdColor = document.createElement('td');
      const sw = document.createElement('span');
      sw.style.display = 'inline-block'; sw.style.width = '16px'; sw.style.height = '16px';
      sw.style.backgroundColor = item.color; sw.style.border = '1px solid #000';
      tdColor.appendChild(sw);
      tr.appendChild(tdColor);
      // Доступность
      const tdAvail = document.createElement('td'); tdAvail.textContent = item.availability; tr.appendChild(tdAvail);
      // Действия
      const tdAct = document.createElement('td');
      const delBtn = document.createElement('button'); delBtn.textContent = 'Удалить';
      delBtn.addEventListener('click', () => {
        const newItems = items.filter(x => x.id !== item.id);
        localStorage.setItem('items', JSON.stringify(newItems));
        renderItemsList();
      });
      tdAct.appendChild(delBtn);
      tr.appendChild(tdAct);
      tbody.appendChild(tr);
    });
  }
  // Инициализируем список предметов
  renderItemsList();

  // Обработка отправки формы
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Собираем общие параметры
    const category = document.getElementById('item-category').value;
    const layer = document.getElementById('item-layer').value;
    const availability = document.getElementById('item-availability').value;
    const startDate = availability === 'time-limited' ? document.getElementById('start-date').value : undefined;
    const endDate = availability === 'time-limited' ? document.getElementById('end-date').value : undefined;
    const users = availability === 'private' ? document.getElementById('user-list').value : undefined;
    // Файлы PNG – несколько
    const files = Array.from(document.getElementById('item-files').files);
    // Группируем по ID (из имени до подчёркивания)
    const groups = {};
    files.forEach(f => {
      const base = f.name.replace(/\.png$/i, '');
      const parts = base.split('_');
      const colorHex = parts.pop();
      const id = parts.join('_');
      if (!groups[id]) groups[id] = { id, colors: new Set() };
      groups[id].colors.add(`#${colorHex}`);
    });
    // Сохраняем группу предметов
    const itemsArr = JSON.parse(localStorage.getItem('items') || '[]');
    Object.values(groups).forEach(group => {
      const newItem = {
        id: group.id,
        category,
        layer,
        colors: Array.from(group.colors),
        availability,
        start: startDate,
        end: endDate,
        users
      };
      itemsArr.push(newItem);
    });
    localStorage.setItem('items', JSON.stringify(itemsArr));
    renderItemsList();
    alert('Предметы добавлены');
    form.reset();
    settings.innerHTML = '';
  });

  // Настройка видимости категорий
  const categoryConfigs = [
    {value: 'background', label: 'Фон'},
    {value: 'hair_back', label: 'Волосы сзади'},
    {value: 'tail', label: 'Хвост'},
    {value: 'body', label: 'Тело'},
    {value: 'eyes', label: 'Глаза'},
    {value: 'mouth', label: 'Рот'},
    {value: 'face_accessory', label: 'Аксессуар'},
    {value: 'hair_strands', label: 'Хвостики волос'},
    {value: 'bangs', label: 'Челка'},
    {value: 'headwear', label: 'Головной убор'},
    {value: 'shoes', label: 'Обувь'},
    {value: 'pants', label: 'Брюки'},
    {value: 'top', label: 'Рубашка'},
    {value: 'dress', label: 'Платье'},
    {value: 'jumpsuit', label: 'Комбинезон'},
    {value: 'coat', label: 'Пальто'},
    {value: 'accessory', label: 'Аксессуары'},
    {value: 'pet', label: 'Питомец'}
  ];

  // Заполняем список зарегистрированных игроков
  const usersData = JSON.parse(localStorage.getItem('users') || '{}');
  const usersListEl = document.getElementById('users-list');
  Object.keys(usersData).forEach(username => {
    const li = document.createElement('li');
    li.textContent = username;
    usersListEl.appendChild(li);
  });

  const storageKey = 'categoriesVisibility';
  let visibilitySettings = JSON.parse(localStorage.getItem(storageKey) || '{}');
  // Инициализация: если нет настроек, делаем все категории видимыми
  if (Object.keys(visibilitySettings).length === 0) {
    visibilitySettings = {};
    categoryConfigs.forEach(({value}) => visibilitySettings[value] = true);
    localStorage.setItem(storageKey, JSON.stringify(visibilitySettings));
  }
  const settingsList = document.getElementById('category-settings-list');
  categoryConfigs.forEach(({value, label}) => {
    const row = document.createElement('div');
    row.className = 'form-row';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `cat-${value}`;
    checkbox.checked = visibilitySettings[value];
    checkbox.dataset.category = value;
    const lab = document.createElement('label');
    lab.htmlFor = checkbox.id;
    lab.textContent = label;
    lab.prepend(checkbox);
    row.appendChild(lab);
    settingsList.appendChild(row);
    checkbox.addEventListener('change', () => {
      visibilitySettings[value] = checkbox.checked;
      localStorage.setItem(storageKey, JSON.stringify(visibilitySettings));
    });
  });
});
