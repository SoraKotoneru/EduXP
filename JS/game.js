// Получаем элементы
const logoutBtn     = document.getElementById('logout-btn');
const galleryBtn    = document.getElementById('gallery-btn');
const categoryList  = document.getElementById('category-list');
const inventoryBar  = document.getElementById('inventory-bar');
const avatarCanvas  = document.getElementById('avatar-canvas');
const saveBtn       = document.getElementById('save-btn');
const resetBtn      = document.getElementById('reset-btn');
const notifications = document.getElementById('notifications');

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
function loadItems(category) {
  inventoryBar.innerHTML = `Загружаем ${category}...`;
  // TODO: здесь будет запрос к серверу или localStorage
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
  // по умолчанию показываем первую категорию
  loadItems('hair');
})();
