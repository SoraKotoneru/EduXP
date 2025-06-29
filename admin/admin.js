document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('item-form');
  const availability = document.getElementById('item-availability');
  const settings = document.getElementById('availability-settings');

  // Показываем дополнительные поля для настройки доступности
  availability.addEventListener('change', () => {
    settings.innerHTML = '';
    if (availability.value === 'private') {
      settings.innerHTML = `
        <label for="user-list">Пользователи (ID через запятую):</label>
        <input type="text" id="user-list" placeholder="user1,user2">
      `;
    }
  });

  // Загрузка и рендер предметов через API
  async function renderItemsList() {
    const response = await fetch('/api/items/all');
    const data = await response.json();
    const itemsArr = [];
    Object.entries(data).forEach(([category, arr]) => arr.forEach(item => itemsArr.push(item)));
    const tbody = document.querySelector('#items-table tbody');
    tbody.innerHTML = '';
    itemsArr.forEach(item => {
      const tr = document.createElement('tr');
      // ID
      const tdId = document.createElement('td'); tdId.textContent = item.id; tr.appendChild(tdId);
      // Категория (русское название)
      const tdCat = document.createElement('td');
      const catRu = categoryConfigs.find(c => c.value === item.category)?.label || item.category;
      tdCat.textContent = catRu;
      tr.appendChild(tdCat);
      // Слой
      const tdLayer = document.createElement('td'); tdLayer.textContent = item.layer; tr.appendChild(tdLayer);
      // Миниатюра
      const tdThumb = document.createElement('td');
      if (item.thumbnail) {
        const img = document.createElement('img');
        img.src = `../assets/сlothes/${item.category}/${item.thumbnail}`;
        img.alt = item.id;
        img.style.width = '40px'; img.style.height = 'auto';
        tdThumb.appendChild(img);
      } else {
        tdThumb.textContent = '-';
      }
      tr.appendChild(tdThumb);
      // Цвета
      const tdColor = document.createElement('td');
      (item.colors || []).forEach(col => {
        const sw = document.createElement('span');
        sw.style.display = 'inline-block'; sw.style.width = '16px'; sw.style.height = '16px';
        sw.style.backgroundColor = col; sw.style.border = '1px solid #000'; sw.style.marginRight = '4px';
        tdColor.appendChild(sw);
      });
      tr.appendChild(tdColor);
      // Доступность (чекбокс time-limited)
      const tdAvail = document.createElement('td');
      const chkVis = document.createElement('input');
      chkVis.type = 'checkbox';
      chkVis.checked = item.visible;
      // Обработчик изменения доступности
      chkVis.addEventListener('change', async () => {
        const newVis = chkVis.checked;
        await fetch(`/api/items/${item.id}`, {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ visible: newVis })
        });
        renderItemsList();
      });
      const lblVis = document.createElement('span');
      lblVis.textContent = chkVis.checked ? 'Visible' : 'Hidden';
      // Обновляем текст при смене
      chkVis.addEventListener('change', () => {
        lblVis.textContent = chkVis.checked ? 'Visible' : 'Hidden';
      });
      tdAvail.appendChild(chkVis);
      tdAvail.appendChild(lblVis);
      tr.appendChild(tdAvail);
      // Пользователи: для private-вещей ввод списка ID
      const tdUsers = document.createElement('td');
      if (item.availability === 'private') {
        const inputUsers = document.createElement('input');
        inputUsers.value = item.users || '';
        inputUsers.placeholder = 'ID через запятую';
        const saveUsersBtn = document.createElement('button');
        saveUsersBtn.textContent = 'Сохранить';
        saveUsersBtn.addEventListener('click', async () => {
          const newUsers = inputUsers.value.trim();
          await fetch(`/api/items/${item.id}`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ users: newUsers })
          });
          renderItemsList();
        });
        tdUsers.appendChild(inputUsers);
        tdUsers.appendChild(saveUsersBtn);
      } else {
        tdUsers.textContent = '-';
      }
      tr.appendChild(tdUsers);
      // Действия
      const tdAct = document.createElement('td');
      const delBtn = document.createElement('button'); delBtn.textContent = 'Удалить';
      delBtn.addEventListener('click', async () => {
        await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
        renderItemsList();
      });
      tdAct.appendChild(delBtn); tr.appendChild(tdAct);
      tbody.appendChild(tr);
    });
  }
  // Инициализируем список предметов
  renderItemsList();

  // Обработка отправки формы
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const category = document.getElementById('item-category').value;
    const layer = document.getElementById('item-layer').value;
    const availability = document.getElementById('item-availability').value;
    const users = availability === 'private' ? document.getElementById('user-list').value : undefined;
    // Подготавливаем FormData для API
    const formData = new FormData();
    formData.append('category', category);
    formData.append('layer', layer);
    formData.append('availability', availability);
    if (users) formData.append('users', users);
    const files = document.getElementById('item-files').files;
    // Теперь файлы всегда обязательны
    for (const file of files) {
      formData.append('files', file);
    }
    // Добавляем миниатюру
    const thumbnail = document.getElementById('item-thumbnail').files[0];
    if (thumbnail) {
      formData.append('thumbnail', thumbnail);
    }
    const response = await fetch('/api/items', { method: 'POST', body: formData });
    const data = await response.json();
    if (!response.ok) {
      alert('Ошибка при добавлении: ' + (data.error || 'Server error'));
      return;
    }
    alert('Предметы добавлены');
    form.reset();
    settings.innerHTML = '';
    renderItemsList();
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
  // Загрузка и рендер списка зарегистрированных игроков через API
  async function renderUsersList() {
    const response = await fetch('/api/users');
    let users = await response.json();
    // Сортируем пользователей по ID
    users = users.sort((a, b) => a.id - b.id);
    const usersListEl = document.getElementById('users-list');
    usersListEl.innerHTML = '';
    users.forEach(user => {
      const tr = document.createElement('tr');
      const tdId = document.createElement('td');
      tdId.textContent = user.id;
      tr.appendChild(tdId);
      const tdName = document.createElement('td');
      tdName.textContent = user.username;
      tr.appendChild(tdName);
      usersListEl.appendChild(tr);
    });
  }
  // Инициализируем список игроков
  renderUsersList();

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
