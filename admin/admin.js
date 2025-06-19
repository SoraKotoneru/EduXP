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

  // Обработка отправки формы
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('category', document.getElementById('item-category').value);
    data.append('id', document.getElementById('item-id').value);
    data.append('layer', document.getElementById('item-layer').value);
    data.append('colors', document.getElementById('item-colors').value);
    const files = document.getElementById('item-files').files;
    for (let f of files) {
      data.append('files', f);
    }
    data.append('availability', availability.value);
    if (availability.value === 'time-limited') {
      data.append('start', document.getElementById('start-date').value);
      data.append('end', document.getElementById('end-date').value);
    } else if (availability.value === 'private') {
      data.append('users', document.getElementById('user-list').value);
    }

    // TODO: отправить на сервер
    console.log('Отправка данных:', Object.fromEntries(data.entries()));
    alert('Предмет добавлен (заглушка)');
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
